"""Authentication service using Argon2id and PyJWT."""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
import jwt
from app.config import settings

# Argon2id tuned for free-tier Render container
ph = PasswordHasher(
    time_cost=2,
    memory_cost=65536,  # 64 MiB
    parallelism=1,
    hash_len=32,
    salt_len=16
)

def hash_password(password: str) -> str:
    """Hash a plaintext password using Argon2id."""
    return ph.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    """Verify a plaintext password against an Argon2id hash."""
    try:
        return ph.verify(hashed, password)
    except (VerifyMismatchError, InvalidHashError):
        return False

def create_access_token(user_id: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT session token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(hours=settings.SESSION_EXPIRE_HOURS)

    payload: Dict[str, Any] = {
        "sub": user_id,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp())
    }
    return jwt.encode(payload, settings.SESSION_SECRET, algorithm="HS256")

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and strictly verify a JWT session token."""
    try:
        payload = jwt.verify_signature = jwt.decode(
            token,
            settings.SESSION_SECRET,
            algorithms=["HS256"],
            options={"require": ["exp", "iat", "sub"]}
        )
        return payload
    except (jwt.PyJWTError, Exception):
        return None
