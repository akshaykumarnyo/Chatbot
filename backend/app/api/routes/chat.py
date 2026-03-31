from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
#from fastapi.staticfile import StaticFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
import uuid

from app.db.session import get_db
from app.models.models import Session as ChatSession, Message, User
from app.api.routes.auth import get_current_user
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["Chat"])

# ── Schemas ────────────────────────────────────────────────────────────────────
class AskRequest(BaseModel):
    question:   str
    session_id: Optional[str] = None

class SessionOut(BaseModel):
    id:         str
    title:      Optional[str]
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

class MessageOut(BaseModel):
    id:           str
    role:         str
    content:      str
    sql_generated: Optional[str]
    rows_returned: int
    created_at:   datetime

# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/ask")
async def ask(body: AskRequest,
              user: User = Depends(get_current_user),
              db: AsyncSession = Depends(get_db)):
    """Stream SSE response for a chat question."""
    if not body.question.strip():
        raise HTTPException(400, "Question cannot be empty")

    # Get or create session
    if body.session_id:
        result     = await db.execute(
            select(ChatSession).where(ChatSession.id == uuid.UUID(body.session_id),
                                      ChatSession.user_id == user.id))
        session    = result.scalar_one_or_none()
        if not session:
            raise HTTPException(404, "Session not found")
        session_id = body.session_id
    else:
        session = ChatSession(
            id=uuid.uuid4(), user_id=user.id, is_active=True,
            created_at=datetime.utcnow(), updated_at=datetime.utcnow(),
        )
        db.add(session); await db.commit()
        session_id = str(session.id)

    svc = ChatService(db)

    async def event_stream():
        import json
        yield f"event: session\ndata: {json.dumps({'session_id': session_id})}\n\n"
        async for chunk in svc.process(body.question.strip(), session_id, str(user.id)):
            yield chunk

    return StreamingResponse(event_stream(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache",
                                      "X-Accel-Buffering": "no"})

@router.get("/sessions")
async def list_sessions(user: User = Depends(get_current_user),
                        db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChatSession).where(ChatSession.user_id == user.id,
                                  ChatSession.is_active == True)
                           .order_by(ChatSession.updated_at.desc()).limit(50)
    )
    sessions = result.scalars().all()
    out = []
    for s in sessions:
        cnt = await db.execute(
            select(Message).where(Message.session_id == s.id)
        )
        out.append({"id":str(s.id),"title":s.title,
                    "created_at":s.created_at,"updated_at":s.updated_at,
                    "message_count": len(cnt.scalars().all())})
    return out

@router.get("/sessions/{session_id}/messages")
async def get_messages(session_id: str,
                       user: User = Depends(get_current_user),
                       db: AsyncSession = Depends(get_db)):
    # Verify ownership
    sess = await db.execute(
        select(ChatSession).where(ChatSession.id == uuid.UUID(session_id),
                                  ChatSession.user_id == user.id))
    if not sess.scalar_one_or_none():
        raise HTTPException(404, "Session not found")
    msgs = await db.execute(
        select(Message).where(Message.session_id == uuid.UUID(session_id))
                       .order_by(Message.created_at.asc())
    )
    return [{"id":str(m.id),"role":m.role,"content":m.content,
             "sql_generated":m.sql_generated,"rows_returned":m.rows_returned,
             "created_at":m.created_at} for m in msgs.scalars().all()]

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str,
                         user: User = Depends(get_current_user),
                         db: AsyncSession = Depends(get_db)):
    await db.execute(
        update(ChatSession)
        .where(ChatSession.id == uuid.UUID(session_id), ChatSession.user_id == user.id)
        .values(is_active=False)
    )
    await db.commit()
    return {"message": "Session deleted"}

@router.post("/sessions/new")
async def new_session(user: User = Depends(get_current_user),
                      db: AsyncSession = Depends(get_db)):
    session = ChatSession(id=uuid.uuid4(), user_id=user.id, is_active=True,
                          created_at=datetime.utcnow(), updated_at=datetime.utcnow())
    db.add(session); await db.commit()
    return {"session_id": str(session.id)}
