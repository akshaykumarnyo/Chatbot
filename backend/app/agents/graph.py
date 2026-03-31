"""
LangGraph Agent Pipeline
────────────────────────
Flow:
  parse_intent → generate_sql → validate_sql → execute_query → generate_answer
  (with Redis cache check before DB hit)
"""
import re, json, time, logging
from typing import TypedDict, Optional, List, Annotated
from typing_extensions import TypedDict
import operator

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda
from langgraph.graph import StateGraph, END
from app.core.config import settings

logger = logging.getLogger(__name__)

# ── LLM ──────────────────────────────────────────────────────────────────────
def get_llm(temperature: float = 0.0) -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=temperature,
        convert_system_message_to_human=True,
    )

# ── Schema context ────────────────────────────────────────────────────────────
DB_SCHEMA = """
PostgreSQL TABLE: sales_data
COLUMNS:
  id, order_id, order_date (DATE), ship_date (DATE), ship_mode,
  customer_id, customer_name, segment (Consumer/Corporate/Home Office),
  country, city, state, postal_code, region (East/West/Central/South),
  product_id, category (Technology/Furniture/Office Supplies),
  sub_category, product_name,
  sales (NUMERIC), quantity (INTEGER), discount (NUMERIC), profit (NUMERIC),
  created_at

IMPORTANT RULES:
- Only generate SELECT queries
- Use LOWER() for string comparisons
- Always add LIMIT if not aggregating (max 100)
- Use proper PostgreSQL date functions: DATE_TRUNC, EXTRACT, etc.
- For "top N" use ORDER BY + LIMIT
- Never use DROP, DELETE, INSERT, UPDATE, CREATE, ALTER
"""

# ── State ─────────────────────────────────────────────────────────────────────
class AgentState(TypedDict):
    question:     str
    session_id:   str
    user_id:      str
    history:      List[dict]          # last N message pairs for context
    intent:       Optional[str]       # classified intent
    sql_query:    Optional[str]       # generated SQL
    sql_valid:    bool
    db_result:    Optional[List[dict]]
    row_count:    int
    answer:       Optional[str]       # final natural language answer
    error:        Optional[str]
    from_cache:   bool
    exec_ms:      int
    errors:       Annotated[List[str], operator.add]

def init_state(question: str, session_id: str, user_id: str,
               history: List[dict] = None) -> AgentState:
    return {
        "question": question, "session_id": session_id, "user_id": user_id,
        "history": history or [], "intent": None, "sql_query": None,
        "sql_valid": False, "db_result": None, "row_count": 0,
        "answer": None, "error": None, "from_cache": False,
        "exec_ms": 0, "errors": [],
    }

# ── Node 1: Parse Intent ──────────────────────────────────────────────────────
def node_parse_intent(state: AgentState) -> dict:
    llm    = get_llm(temperature=0.0)
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Classify the user's question about sales data into one of:
- DATA_QUERY: wants specific data from database
- GREETING: hello/hi/thanks
- CLARIFICATION: asking about previous response
- OFF_TOPIC: unrelated to sales

Respond with ONLY the classification word."""),
        ("human", "{question}"),
    ])
    chain  = prompt | llm | StrOutputParser()
    intent = chain.invoke({"question": state["question"]}).strip().upper()
    if intent not in ["DATA_QUERY", "GREETING", "CLARIFICATION", "OFF_TOPIC"]:
        intent = "DATA_QUERY"
    logger.info(f"Intent: {intent}")
    return {"intent": intent, "errors": []}

# ── Node 2: Generate SQL ──────────────────────────────────────────────────────
def node_generate_sql(state: AgentState) -> dict:
    if state["intent"] != "DATA_QUERY":
        return {"sql_query": None, "errors": []}

    # Build conversation history context
    history_ctx = ""
    if state["history"]:
        pairs = []
        for msg in state["history"][-6:]:  # last 3 pairs
            pairs.append(f"{msg['role'].upper()}: {msg['content'][:200]}")
        history_ctx = "\nCONVERSATION HISTORY:\n" + "\n".join(pairs)

    llm    = get_llm(temperature=0.0)
    prompt = ChatPromptTemplate.from_messages([
        ("system", f"""You are an expert SQL analyst.
{DB_SCHEMA}
{history_ctx}

Generate ONLY a valid PostgreSQL SELECT query. No explanation, no markdown, no backticks.
If the question cannot be answered with the available data, return: CANNOT_ANSWER"""),
        ("human", "Question: {question}"),
    ])
    chain = prompt | llm | StrOutputParser()
    sql   = chain.invoke({"question": state["question"]}).strip()

    # Strip markdown if present
    sql = re.sub(r"```sql\s*", "", sql, flags=re.IGNORECASE)
    sql = re.sub(r"```\s*", "", sql).strip()

    logger.info(f"Generated SQL: {sql[:120]}")
    return {"sql_query": sql, "errors": []}

# ── Node 3: Validate SQL ──────────────────────────────────────────────────────
def node_validate_sql(state: AgentState) -> dict:
    sql = state.get("sql_query", "")
    if not sql or sql == "CANNOT_ANSWER":
        return {"sql_valid": False, "errors": []}

    sql_lower = sql.lower().strip()
    # Must start with SELECT
    if not re.match(r"^\s*select\s+", sql_lower):
        return {"sql_valid": False, "error": "Only SELECT queries allowed",
                "errors": ["Non-SELECT query blocked"]}
    # Block dangerous keywords
    dangerous = r"\b(insert|update|delete|drop|alter|truncate|create|replace|exec)\b"
    if re.search(dangerous, sql_lower):
        return {"sql_valid": False, "error": "Unsafe SQL blocked",
                "errors": ["Dangerous keyword detected"]}

    return {"sql_valid": True, "errors": []}

# ── Node 4: Execute Query (called from service, not graph node directly) ──────
# Note: DB execution is async and handled by the service layer;
# the graph node below receives pre-fetched data via state injection.

def node_generate_answer(state: AgentState) -> dict:
    """Convert raw DB result to natural language using LLM."""
    question   = state["question"]
    db_result  = state.get("db_result")
    row_count  = state.get("row_count", 0)
    intent     = state.get("intent", "DATA_QUERY")
    error      = state.get("error")
    from_cache = state.get("from_cache", False)

    # Handle non-data intents
    if intent == "GREETING":
        return {"answer": "Hello! I'm your Sales AI assistant. Ask me anything about your sales data — like top products, revenue by region, monthly trends, or customer insights!", "errors": []}
    if intent == "OFF_TOPIC":
        return {"answer": "I specialize in sales data analysis. Try asking about sales revenue, top products, customer segments, regional performance, or profit trends!", "errors": []}
    if error:
        return {"answer": f"I encountered an issue: {error}. Please try rephrasing your question.", "errors": []}
    if not db_result and state.get("sql_query") == "CANNOT_ANSWER":
        return {"answer": "I don't have enough information to answer that specific question. Try asking about sales, profit, products, regions, or customer segments.", "errors": []}
    if not db_result:
        return {"answer": "No data was found matching your query. Try different filters or time periods.", "errors": []}

    # Prepare data summary for LLM
    data_str = json.dumps(db_result[:20], indent=2, default=str)
    cache_note = " (retrieved from cache)" if from_cache else ""

    llm    = get_llm(temperature=0.3)
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a helpful business intelligence assistant.
Convert the database result into a clear, insightful natural language answer.

Guidelines:
- Lead with the direct answer to the question
- Highlight key numbers and trends
- Use bullet points for multiple items
- Format currency as $X,XXX.XX
- Keep it concise but complete (3-6 sentences or bullet points)
- If showing top items, list them clearly
- Add one business insight or recommendation when relevant"""),
        ("human", """Question: {question}

Database Result ({row_count} rows{cache_note}):
{data_str}

Provide a clear, business-friendly answer:"""),
    ])
    chain  = prompt | llm | StrOutputParser()
    # FIXED: Pass all required variables to invoke()
    answer = chain.invoke({
        "question": question,
        "row_count": row_count,
        "cache_note": cache_note,
        "data_str": data_str
    })
    return {"answer": answer.strip(), "errors": []}

# ── Build LangGraph ────────────────────────────────────────────────────────────
def build_graph() -> StateGraph:
    wf = StateGraph(AgentState)

    wf.add_node("parse_intent",      node_parse_intent)
    wf.add_node("generate_sql",      node_generate_sql)
    wf.add_node("validate_sql",      node_validate_sql)
    wf.add_node("generate_answer",   node_generate_answer)

    wf.set_entry_point("parse_intent")
    wf.add_edge("parse_intent",    "generate_sql")
    wf.add_edge("generate_sql",    "validate_sql")
    wf.add_edge("validate_sql",    "generate_answer")
    wf.add_edge("generate_answer", END)

    return wf.compile()

compiled_graph = build_graph()