"""In-memory brute-force protection for the login endpoint (single uvicorn process).

- Per account: 5 failed attempts lock that email for 15 minutes.
- Per client IP: at most 30 login attempts per 15 minutes.
The client IP comes from nginx's X-Real-IP header (already the real visitor IP behind Cloudflare).
"""
import threading
import time
from typing import Dict, List, Tuple

from fastapi import Request

MAX_FAILURES_PER_ACCOUNT = 5
LOCK_SECONDS = 15 * 60
MAX_ATTEMPTS_PER_IP = 30
IP_WINDOW_SECONDS = 15 * 60

_lock = threading.Lock()
_failures: Dict[str, List[float]] = {}  # email -> failure timestamps
_locked_until: Dict[str, float] = {}  # email -> unix time
_ip_attempts: Dict[str, List[float]] = {}  # ip -> attempt timestamps


def client_ip(request: Request) -> str:
    return (
        request.headers.get("x-real-ip")
        or request.headers.get("cf-connecting-ip")
        or (request.client.host if request.client else "unknown")
    )


def check_allowed(email: str, ip: str) -> Tuple[bool, str]:
    """Record an attempt and say whether it may proceed."""
    now = time.time()
    with _lock:
        attempts = [t for t in _ip_attempts.get(ip, []) if now - t < IP_WINDOW_SECONDS]
        attempts.append(now)
        _ip_attempts[ip] = attempts
        if len(attempts) > MAX_ATTEMPTS_PER_IP:
            return False, "Too many login attempts from your network. Please try again later."
        if _locked_until.get(email, 0) > now:
            return False, "Too many failed attempts for this account. Please try again in 15 minutes."
    return True, ""


def record_failure(email: str) -> None:
    now = time.time()
    with _lock:
        recent = [t for t in _failures.get(email, []) if now - t < LOCK_SECONDS]
        recent.append(now)
        _failures[email] = recent
        if len(recent) >= MAX_FAILURES_PER_ACCOUNT:
            _locked_until[email] = now + LOCK_SECONDS
            _failures[email] = []
        if len(_ip_attempts) > 10000:  # keep memory bounded
            for key in [k for k, v in _ip_attempts.items() if not v or now - v[-1] > IP_WINDOW_SECONDS]:
                _ip_attempts.pop(key, None)


def record_success(email: str) -> None:
    with _lock:
        _failures.pop(email, None)
        _locked_until.pop(email, None)
