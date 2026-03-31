from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
#from fastapi.staticfile import StaticFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime
import uuid

from app.db.session import get_db
from app.db.redis import cache_set, cache_get, cache_delete
from app.models.models import User
from app.core.security import (hash_password, verify_password,
                                create_access_token, create_refresh_token, decode_token)
from app.core.config import settings
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ── Schemas ────────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email:     EmailStr
    full_name: str
    password:  str

class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
    user_id:       str
    email:         str
    full_name:     str
    role:          str

class UserOut(BaseModel):
    id:        str
    email:     str
    full_name: str
    role:      str
    is_active: bool
    created_at: datetime

# ── Dependency ─────────────────────────────────────────────────────────────────
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    try:
        payload = decode_token(token)
        # Extract user_id from the "sub" field in the token payload
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")

    # Check Redis first
    cached = await cache_get(f"user:{user_id}")
    if cached:
        # Rebuild minimal User object
        u = User()
        u.id = uuid.UUID(cached["id"]); u.email = cached["email"]
        u.full_name = cached["full_name"]; u.role = cached["role"]
        u.is_active = cached["is_active"]
        return u

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user   = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    # Cache for 5 min
    await cache_set(f"user:{user_id}",
                    {"id":str(user.id),"email":user.email,"full_name":user.full_name,
                     "role":user.role,"is_active":user.is_active}, ttl=300)
    return user

# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")
    user = User(
        id=uuid.uuid4(), email=body.email, full_name=body.full_name,
        password_hash=hash_password(body.password), role="user",
        created_at=datetime.utcnow(), updated_at=datetime.utcnow(),
    )
    db.add(user); await db.commit(); await db.refresh(user)
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user_id=str(user.id), email=user.email,
        full_name=user.full_name, role=user.role,
    )

@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(),
                db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form.username))
    user   = result.scalar_one_or_none()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    if not user.is_active:
        raise HTTPException(403, "Account inactive")
    # Update last_login
    await db.execute(update(User).where(User.id == user.id)
                     .values(last_login=datetime.utcnow()))
    await db.commit()
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        user_id=str(user.id), email=user.email,
        full_name=user.full_name, role=user.role,
    )

@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return UserOut(id=str(user.id), email=user.email, full_name=user.full_name,
                   role=user.role, is_active=user.is_active,
                   created_at=getattr(user, "created_at", datetime.utcnow()))

@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id:
            await cache_delete(f"user:{user_id}")
    except ValueError:
        # Token is invalid, but we can still return success
        pass
    return {"message": "Logged out"}