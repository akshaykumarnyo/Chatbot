import json
import hashlib
from typing import Any, Optional
import redis.asyncio as aioredis
from app.core.config import settings

_pool: aioredis.Redis | None = None

async def get_redis() -> aioredis.Redis:
    global _pool
    if _pool is None:
        _pool = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
        )
    return _pool

async def cache_get(key: str) -> Optional[Any]:
    r = await get_redis()
    val = await r.get(key)
    return json.loads(val) if val else None

async def cache_set(key: str, value: Any, ttl: int = None) -> None:
    r   = await get_redis()
    ttl = ttl or settings.REDIS_CACHE_TTL
    await r.setex(key, ttl, json.dumps(value, default=str))

async def cache_delete(key: str) -> None:
    r = await get_redis()
    await r.delete(key)

async def cache_exists(key: str) -> bool:
    r = await get_redis()
    return bool(await r.exists(key))

def make_cache_key(prefix: str, *parts: str) -> str:
    content = ":".join(parts)
    return f"{prefix}:{hashlib.sha256(content.encode()).hexdigest()[:16]}"

def question_hash(question: str) -> str:
    normalized = " ".join(question.lower().split())
    return hashlib.sha256(normalized.encode()).hexdigest()
