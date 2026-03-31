import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Text, Integer, Numeric, Date, TIMESTAMP, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    id            : Mapped[uuid.UUID]       = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email         : Mapped[str]             = mapped_column(String(255), unique=True, nullable=False)
    full_name     : Mapped[str]             = mapped_column(String(255), nullable=False)
    password_hash : Mapped[str]             = mapped_column(String(255), nullable=False)
    role          : Mapped[str]             = mapped_column(String(50), default="user")
    is_active     : Mapped[bool]            = mapped_column(Boolean, default=True)
    avatar_url    : Mapped[str | None]      = mapped_column(Text)
    created_at    : Mapped[datetime]        = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at    : Mapped[datetime]        = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    last_login    : Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    sessions      = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    messages      = relationship("Message", back_populates="user")

class Session(Base):
    __tablename__ = "sessions"
    id         : Mapped[uuid.UUID]      = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id    : Mapped[uuid.UUID]      = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    title      : Mapped[str | None]     = mapped_column(String(255))
    is_active  : Mapped[bool]           = mapped_column(Boolean, default=True)
    created_at : Mapped[datetime]       = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    updated_at : Mapped[datetime]       = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    metadata_  : Mapped[dict]           = mapped_column("metadata", JSON, default=dict)
    user       = relationship("User", back_populates="sessions")
    messages   = relationship("Message", back_populates="session", cascade="all, delete-orphan")

class Message(Base):
    __tablename__  = "messages"
    id             : Mapped[uuid.UUID]      = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id     : Mapped[uuid.UUID]      = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"))
    user_id        : Mapped[uuid.UUID]      = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    role           : Mapped[str]            = mapped_column(String(20))
    content        : Mapped[str]            = mapped_column(Text)
    sql_generated  : Mapped[str | None]     = mapped_column(Text)
    rows_returned  : Mapped[int]            = mapped_column(Integer, default=0)
    execution_ms   : Mapped[int | None]     = mapped_column(Integer)
    llm_model      : Mapped[str | None]     = mapped_column(String(100))
    token_count    : Mapped[int | None]     = mapped_column(Integer)
    is_error       : Mapped[bool]           = mapped_column(Boolean, default=False)
    created_at     : Mapped[datetime]       = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    metadata_      : Mapped[dict]           = mapped_column("metadata", JSON, default=dict)
    session        = relationship("Session", back_populates="messages")
    user           = relationship("User", back_populates="messages")

class SalesData(Base):
    __tablename__  = "sales_data"
    id             : Mapped[int]            = mapped_column(Integer, primary_key=True, autoincrement=True)
    order_id       : Mapped[str]            = mapped_column(String(50), unique=True)
    order_date     : Mapped[datetime]       = mapped_column(Date)
    ship_date      : Mapped[datetime | None]= mapped_column(Date)
    ship_mode      : Mapped[str | None]     = mapped_column(String(50))
    customer_id    : Mapped[str | None]     = mapped_column(String(50))
    customer_name  : Mapped[str | None]     = mapped_column(String(255))
    segment        : Mapped[str | None]     = mapped_column(String(50))
    country        : Mapped[str | None]     = mapped_column(String(100))
    city           : Mapped[str | None]     = mapped_column(String(100))
    state          : Mapped[str | None]     = mapped_column(String(100))
    region         : Mapped[str | None]     = mapped_column(String(50))
    category       : Mapped[str | None]     = mapped_column(String(100))
    sub_category   : Mapped[str | None]     = mapped_column(String(100))
    product_name   : Mapped[str | None]     = mapped_column(String(500))
    sales          : Mapped[float | None]   = mapped_column(Numeric(12,4))
    quantity       : Mapped[int | None]     = mapped_column(Integer)
    discount       : Mapped[float | None]   = mapped_column(Numeric(5,4))
    profit         : Mapped[float | None]   = mapped_column(Numeric(12,4))
    created_at     : Mapped[datetime]       = mapped_column(TIMESTAMP(timezone=True), default=datetime.utcnow)
