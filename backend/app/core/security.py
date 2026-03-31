import os
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
import jwt
from typing import Optional

# Use argon2 instead of bcrypt to avoid bcrypt version conflicts
# Argon2 is more secure anyway and doesn't have the 72-byte limitation
pwd_ctx = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)

# JWT configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

def hash_password(plain: str) -> str:
    """Hash a password using argon2 (more secure, no byte limit)"""
    if not plain:
        raise ValueError("Password cannot be empty")
    return pwd_ctx.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    try:
        return pwd_ctx.verify(plain, hashed)
    except Exception:
        return False

def create_access_token(data, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token
    
    Args:
        data: Either a dictionary or a user ID (string/int)
        expires_delta: Optional custom expiration time
    """
    # Handle both string/int (user_id) and dict inputs
    if isinstance(data, dict):
        to_encode = data.copy()
    else:
        # If data is a string or int (user_id), wrap it in a dict
        to_encode = {"sub": str(data)}
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT refresh token with longer expiration
    
    Args:
        data: Either a dictionary or a user ID (string/int)
        expires_delta: Optional custom expiration time
    """
    # Handle both string/int (user_id) and dict inputs
    if isinstance(data, dict):
        to_encode = data.copy()
    else:
        # If data is a string or int (user_id), wrap it in a dict
        to_encode = {"sub": str(data)}
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")