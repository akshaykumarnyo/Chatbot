from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Sales AI Chatbot"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173","http://localhost:3000"]

    # Auth
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_32_chars_min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24   # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://chatbot:chatbot123@localhost:5433/chatbot_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6380/0"
    REDIS_CACHE_TTL: int = 3600          # 1 hour default
    REDIS_SESSION_TTL: int = 86400 * 7   # 7 days

    # Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
