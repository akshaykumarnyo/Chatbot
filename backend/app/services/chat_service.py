"""
Chat Service — orchestrates the full pipeline:
  1. Check Redis cache
  2. Run LangGraph (intent → SQL → validate)
  3. Execute SQL against PostgreSQL (if valid)
  4. Generate natural language answer
  5. Store in Redis cache + PostgreSQL
"""
import time, logging, uuid
from datetime import datetime
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select

from app.agents.graph import compiled_graph, init_state, AgentState
from app.db.redis import cache_get, cache_set, question_hash, make_cache_key
from app.models.models import Message, Session as ChatSession
from app.core.config import settings

logger = logging.getLogger(__name__)

DB_SCHEMA_SUMMARY = """
TABLE: sales_data
Columns: order_id, order_date, ship_date, ship_mode, customer_id, customer_name,
segment, country, city, state, region, product_id, category, sub_category,
product_name, sales, quantity, discount, profit
"""


class ChatService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_history(self, session_id: str, limit: int = 6) -> list[dict]:
        """Load last N messages from PostgreSQL for context."""
        try:
            result = await self.db.execute(
                select(Message)
                .where(Message.session_id == uuid.UUID(session_id))
                .order_by(Message.created_at.desc())
                .limit(limit)
            )
            msgs = result.scalars().all()
            return [{"role": m.role, "content": m.content} for m in reversed(msgs)]
        except Exception as e:
            logger.error(f"get_history error: {e}")
            return []

    async def _execute_sql(self, sql: str) -> tuple[list[dict], int, int]:
        """Execute SQL and return (rows, count, exec_ms)."""
        t0 = time.monotonic()
        try:
            result  = await self.db.execute(text(sql))
            cols    = list(result.keys())
            rows    = [dict(zip(cols, r)) for r in result.fetchall()]
            exec_ms = int((time.monotonic() - t0) * 1000)
            return rows, len(rows), exec_ms
        except Exception as e:
            logger.error(f"SQL execution error: {e}")
            raise

    async def _save_message(self, session_id: str, user_id: str,
                            role: str, content: str, sql: str = None,
                            rows: int = 0, exec_ms: int = 0,
                            is_error: bool = False):
        msg = Message(
            id           = uuid.uuid4(),
            session_id   = uuid.UUID(session_id),
            user_id      = uuid.UUID(user_id),
            role         = role,
            content      = content,
            sql_generated= sql,
            rows_returned= rows,
            execution_ms = exec_ms,
            llm_model    = settings.GEMINI_MODEL,
            is_error     = is_error,
            created_at   = datetime.utcnow(),
        )
        self.db.add(msg)
        await self.db.commit()

    async def _update_session_title(self, session_id: str, title: str):
        await self.db.execute(
            text("UPDATE sessions SET title=:title, updated_at=NOW() WHERE id=:id"),
            {"title": title[:100], "id": session_id}
        )
        await self.db.commit()

    async def process(self, question: str, session_id: str,
                      user_id: str) -> AsyncGenerator[str, None]:
        """
        Full pipeline with Server-Sent Events streaming.
        Yields SSE-formatted strings.
        """
        import json

        def sse(event: str, data: dict) -> str:
            return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"

        # ── Step 1: Cache check ────────────────────────────────────────────
        q_hash    = question_hash(question)
        cache_key = make_cache_key("chat", session_id, q_hash)
        cached    = await cache_get(cache_key)

        if cached:
            yield sse("cached", {"message": "Retrieved from cache"})
            yield sse("result", {
                "answer":       cached["answer"],
                "sql":          cached.get("sql"),
                "row_count":    cached.get("row_count", 0),
                "from_cache":   True,
                "exec_ms":      0,
            })
            # Still save user message to history
            await self._save_message(session_id, user_id, "user", question)
            await self._save_message(session_id, user_id, "assistant",
                                     cached["answer"], cached.get("sql"),
                                     cached.get("row_count", 0), is_error=False)
            return

        # ── Step 2: Load history ───────────────────────────────────────────
        yield sse("thinking", {"step": "loading_context", "message": "Loading conversation context…"})
        history = await self._get_history(session_id)

        # ── Step 3: LangGraph — intent + SQL generation ────────────────────
        yield sse("thinking", {"step": "understanding", "message": "Understanding your question…"})

        state = init_state(question, session_id, user_id, history)

        # Run parse_intent + generate_sql + validate_sql
        for step_output in compiled_graph.stream(state):
            for node_name, partial in step_output.items():
                if isinstance(partial, dict):
                    state.update(partial)
                if node_name == "parse_intent":
                    yield sse("thinking", {"step": "intent", "message": f"Intent: {state.get('intent','?')}"})
                elif node_name == "generate_sql":
                    if state.get("sql_query") and state["sql_query"] != "CANNOT_ANSWER":
                        yield sse("sql", {"sql": state["sql_query"]})
                elif node_name == "validate_sql":
                    if not state.get("sql_valid") and state.get("sql_query") not in [None, "CANNOT_ANSWER"]:
                        yield sse("error", {"message": state.get("error", "SQL validation failed")})
                elif node_name == "generate_answer":
                    pass  # We'll call this after DB execution

        # ── Step 4: Execute SQL ────────────────────────────────────────────
        db_result, row_count, exec_ms = [], 0, 0

        if state.get("sql_valid") and state.get("sql_query"):
            yield sse("thinking", {"step": "querying", "message": "Querying database…"})
            try:
                db_result, row_count, exec_ms = await self._execute_sql(state["sql_query"])
                state["db_result"]  = db_result
                state["row_count"]  = row_count
                state["exec_ms"]    = exec_ms
                yield sse("data", {"row_count": row_count, "exec_ms": exec_ms,
                                    "preview": db_result[:5]})
            except Exception as e:
                state["error"] = str(e)
                yield sse("error", {"message": f"Database error: {str(e)[:200]}"})

        # ── Step 5: Generate answer ────────────────────────────────────────
        yield sse("thinking", {"step": "answering", "message": "Generating your answer…"})

        # Re-run generate_answer node with full state
        from app.agents.graph import node_generate_answer
        answer_update = node_generate_answer(state)
        state.update(answer_update)
        answer = state.get("answer", "I could not generate an answer.")

        # ── Step 6: Cache + persist ────────────────────────────────────────
        cache_payload = {"answer": answer, "sql": state.get("sql_query"),
                         "row_count": row_count}
        await cache_set(cache_key, cache_payload, ttl=settings.REDIS_CACHE_TTL)

        # Save to PostgreSQL
        await self._save_message(session_id, user_id, "user", question)
        await self._save_message(session_id, user_id, "assistant", answer,
                                 state.get("sql_query"), row_count, exec_ms)

        # Update session title if first message
        if len(history) == 0:
            await self._update_session_title(session_id,
                question[:80] + ("…" if len(question) > 80 else ""))

        # ── Step 7: Stream final result ────────────────────────────────────
        yield sse("result", {
            "answer":     answer,
            "sql":        state.get("sql_query"),
            "row_count":  row_count,
            "from_cache": False,
            "exec_ms":    exec_ms,
        })
