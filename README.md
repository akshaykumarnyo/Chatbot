# Sales AI Chatbot 🤖

A production-ready conversational AI that converts natural language questions
into SQL queries, executes them against PostgreSQL, and returns intelligent
answers powered by Gemini AI.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Network                       │
│                                                         │
│  ┌──────────────┐     ┌──────────────┐                  │
│  │   React JS   │────▶│   FastAPI    │                  │
│  │  (port 3000) │ SSE │  (port 8000) │                  │
│  └──────────────┘     └──────┬───────┘                  │
│                              │                          │
│                    ┌─────────┴──────────┐               │
│                    │                    │               │
│             ┌──────▼──────┐   ┌─────────▼──────┐        │
│             │ PostgreSQL  │   │     Redis       │        │
│             │ (port 5433) │   │  (port 6380)    │        │
│             └─────────────┘   └─────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer    | Technology                                        |
|----------|---------------------------------------------------|
| Frontend | React 18 + TypeScript + Vite + Zustand            |
| Backend  | FastAPI + LangGraph + LangChain + Gemini AI       |
| Database | PostgreSQL 16 (users, sessions, messages, sales)  |
| Cache    | Redis 7 (response cache, session tokens)          |
| AI       | Google Gemini 1.5 Flash                           |
| Deploy   | Docker + Docker Compose                           |

---

## Quick Start

### 1. Prerequisites
- Docker + Docker Compose
- A free Gemini API key → https://aistudio.google.com/app/apikey

### 2. Set your Gemini API key
```bash
# Edit backend/.env and set:
GEMINI_API_KEY=your_key_here
```

### 3. Start everything
```bash
docker-compose up --build
```

### 4. Open the app
| Service   | URL                       |
|-----------|---------------------------|
| Frontend  | http://localhost:3000     |
| API docs  | http://localhost:8000/docs|
| API health| http://localhost:8000/health|

### Demo Accounts
All use password: `Password123!`
- `admin@salesai.io`
- `akshay@salesai.io`
- `demo@salesai.io`

---

## Local Development (without Docker)

### Database + Redis via Docker
```bash
docker-compose up postgres redis -d
```

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # edit DATABASE_URL and REDIS_URL to use localhost ports
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

---

## Project Structure

```
chatbot/
├── database/
│   ├── Dockerfile
│   └── init/
│       ├── 01_schema.sql    ← All tables + indexes + triggers
│       └── 02_seed.sql      ← Demo users + sample sales data
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env
│   └── app/
│       ├── main.py          ← FastAPI app
│       ├── core/
│       │   ├── config.py    ← All settings (pydantic-settings)
│       │   └── security.py  ← JWT + bcrypt
│       ├── db/
│       │   ├── session.py   ← Async SQLAlchemy
│       │   └── redis.py     ← Redis cache helpers
│       ├── models/
│       │   └── models.py    ← ORM: User, Session, Message, SalesData
│       ├── agents/
│       │   └── graph.py     ← LangGraph pipeline (intent→SQL→validate→answer)
│       ├── services/
│       │   └── chat_service.py ← Orchestrator (cache→graph→DB→SSE stream)
│       └── api/routes/
│           ├── auth.py      ← /register /login /me /logout
│           └── chat.py      ← /ask (SSE) /sessions /messages
│
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── App.tsx
│       ├── api/client.ts    ← Auth + Chat API calls
│       ├── hooks/useChat.ts ← SSE stream parser + message state
│       ├── store/authStore.ts ← Zustand auth store
│       ├── types/index.ts
│       └── components/
│           ├── AuthPage.tsx     ← Login / Register
│           ├── Sidebar.tsx      ← Session history
│           ├── ChatPage.tsx     ← Main chat layout
│           ├── WelcomeScreen.tsx
│           ├── MessageBubble.tsx← User + AI messages
│           ├── ThinkingBar.tsx  ← Live status + SQL preview
│           └── ChatInput.tsx    ← Input + suggestions
│
├── docker-compose.yml       ← All 4 services wired together
└── README.md
```

---

## How It Works

```
User: "What are the top 5 products by sales?"
          │
          ▼
    FastAPI /chat/ask
          │
          ▼ Check Redis cache (question hash)
    Cache MISS → run LangGraph pipeline:
          │
    ┌─────▼──────────────────────────────────────┐
    │ Node 1: parse_intent                        │
    │   → Gemini classifies: DATA_QUERY           │
    ├─────────────────────────────────────────────┤
    │ Node 2: generate_sql                        │
    │   → Gemini generates:                       │
    │   SELECT product_name, SUM(sales) as total  │
    │   FROM sales_data                           │
    │   GROUP BY product_name                     │
    │   ORDER BY total DESC LIMIT 5               │
    ├─────────────────────────────────────────────┤
    │ Node 3: validate_sql                        │
    │   → Confirms SELECT only, safe              │
    └─────────────────────────────────────────────┘
          │
          ▼ Execute against PostgreSQL
    [ 5 rows returned in 12ms ]
          │
          ▼ generate_answer node
    → Gemini converts rows to natural language
          │
          ▼ Save to Redis (TTL 1hr) + PostgreSQL
          │
          ▼ Stream SSE events to React frontend
    (session → thinking → sql → data → result)
```

---

## API Endpoints

### Auth
| Method | Path               | Description        |
|--------|--------------------|--------------------|
| POST   | /api/auth/register | Register new user  |
| POST   | /api/auth/login    | Login (JWT)        |
| GET    | /api/auth/me       | Current user info  |
| POST   | /api/auth/logout   | Clear cache token  |

### Chat
| Method | Path                              | Description           |
|--------|-----------------------------------|-----------------------|
| POST   | /api/chat/ask                     | Ask question (SSE)    |
| GET    | /api/chat/sessions                | List sessions         |
| POST   | /api/chat/sessions/new            | New session           |
| GET    | /api/chat/sessions/{id}/messages  | Message history       |
| DELETE | /api/chat/sessions/{id}           | Delete session        |
