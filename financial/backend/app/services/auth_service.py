"""Authentication service using Argon2id and PyJWT."""
from datetime import datetime, timedelta, timezone
import threading
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

# Checked against when the username does not exist, so a wrong username takes as long as a wrong password
# (otherwise response times reveal which usernames exist).
_DUMMY_HASH = ph.hash("krs-timing-equaliser-not-a-real-password")

# Each check uses 64 MiB; the container has 512 MB. At most 4 at once, the rest wait (up to 10 s) or get a 503.
_hash_slots = threading.BoundedSemaphore(4)


def verify_login_password(password: str, hashed: Optional[str]) -> bool:
    """Password check for the login endpoint: constant work whether or not the account exists, bounded concurrency."""
    if not _hash_slots.acquire(timeout=10):
        raise TimeoutError("password check busy")
    try:
        ok = verify_password(password, hashed or _DUMMY_HASH)
        return ok and hashed is not None
    finally:
        _hash_slots.release()


def verify_password(password: str, hashed: str) -> bool:
    """Verify a plaintext password against an Argon2id hash."""
    try:
        return ph.verify(hashed, password)
    except (VerifyMismatchError, InvalidHashError):
        return False

def create_access_token(
    user_id: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
    session_version: int = 0,
    auth_time: Optional[int] = None,
) -> str:
    """Create a signed JWT session token.

    Sliding sessions: a token expires after SESSION_IDLE_MINUTES without activity (each request re-issues it, see
    SessionRefreshMiddleware) but never later than SESSION_EXPIRE_HOURS after sign-in (`at` = sign-in time).
    `sv` must match the user's session_version (bumped on sign-out / password reset).
    """
    now = datetime.now(timezone.utc)
    at = auth_time or int(now.timestamp())
    absolute = at + settings.SESSION_EXPIRE_HOURS * 3600
    if expires_delta:
        expire_ts = int((now + expires_delta).timestamp())
    else:
        expire_ts = min(int((now + timedelta(minutes=settings.SESSION_IDLE_MINUTES)).timestamp()), absolute)

    payload: Dict[str, Any] = {
        "sub": user_id,
        "role": role,
        "sv": session_version,
        "at": at,
        "iat": int(now.timestamp()),
        "exp": expire_ts,
    }
    return jwt.encode(payload, settings.SESSION_SECRET, algorithm="HS256")


def refresh_access_token(payload: Dict[str, Any]) -> Optional[str]:
    """New token for an active session (idle timer restarts); None once the absolute limit is reached."""
    at = int(payload.get("at") or payload.get("iat") or 0)
    if datetime.now(timezone.utc).timestamp() >= at + settings.SESSION_EXPIRE_HOURS * 3600:
        return None
    return create_access_token(payload["sub"], payload.get("role", ""), session_version=int(payload.get("sv", 0)), auth_time=at)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and strictly verify a JWT session token."""
    try:
        payload = jwt.decode(
            token,
            settings.SESSION_SECRET,
            algorithms=["HS256"],
            options={"require": ["exp", "iat", "sub"]}
        )
        return payload
    except (jwt.PyJWTError, Exception):
        return None
