"""In-memory brute-force protection for the login endpoint (single uvicorn process).

- Per account AND network: 5 failed attempts lock that account for that network for 15 minutes. Someone guessing
  from their own connection can no longer lock the real user out (security fix, 7 Oct 2026; it was per account).
- Per account from all networks: 30 failures in an hour lock the account for 15 minutes (distributed guessing).
- Per network: at most 30 login attempts per 15 minutes.
The client IP comes from nginx's X-Real-IP header (already the real visitor IP behind Cloudflare). IPv6 addresses
are grouped by /64, since one connection gets a whole /64 and could otherwise rotate addresses.
"""
import ipaddress
import threading
import time
from typing import Dict, List, Tuple

from fastapi import Request

MAX_FAILURES_PER_ACCOUNT_NETWORK = 5
MAX_FAILURES_PER_ACCOUNT = 30
ACCOUNT_WINDOW_SECONDS = 60 * 60
LOCK_SECONDS = 15 * 60
MAX_ATTEMPTS_PER_IP = 30
IP_WINDOW_SECONDS = 15 * 60
MAX_KEYS = 10000

_lock = threading.Lock()
_failures: Dict[str, List[float]] = {}  # "email|network" or "email" -> failure timestamps
_locked_until: Dict[str, float] = {}  # same keys -> unix time
_ip_attempts: Dict[str, List[float]] = {}  # network -> attempt timestamps


def network_key(ip: str) -> str:
    """IPv4 as it is; IPv6 as its /64 network."""
    raw = (ip or "").strip().strip("[]").split("%")[0]
    try:
        addr = ipaddress.ip_address(raw)
    except ValueError:
        return raw or "unknown"
    if isinstance(addr, ipaddress.IPv6Address):
        if addr.ipv4_mapped:
            return str(addr.ipv4_mapped)
        return str(ipaddress.ip_network(f"{addr}/64", strict=False))
    return str(addr)


def client_ip(request: Request) -> str:
    return network_key(
        request.headers.get("x-real-ip")
        or request.headers.get("cf-connecting-ip")
        or (request.client.host if request.client else "unknown")
    )


def _prune(now: float) -> None:
    """Keep memory bounded (called with _lock held)."""
    if len(_ip_attempts) > MAX_KEYS:
        for key in [k for k, v in _ip_attempts.items() if not v or now - v[-1] > IP_WINDOW_SECONDS]:
            _ip_attempts.pop(key, None)
    if len(_failures) > MAX_KEYS:
        for key in [k for k, v in _failures.items() if not v or now - v[-1] > ACCOUNT_WINDOW_SECONDS]:
            _failures.pop(key, None)
    if len(_locked_until) > MAX_KEYS:
        for key in [k for k, v in _locked_until.items() if v <= now]:
            _locked_until.pop(key, None)


def check_allowed(email: str, ip: str) -> Tuple[bool, str]:
    """Record an attempt and say whether it may proceed."""
    now = time.time()
    with _lock:
        _prune(now)
        attempts = [t for t in _ip_attempts.get(ip, []) if now - t < IP_WINDOW_SECONDS]
        attempts.append(now)
        _ip_attempts[ip] = attempts
        if len(attempts) > MAX_ATTEMPTS_PER_IP:
            return False, "Too many login attempts from your network. Please try again later."
        if _locked_until.get(f"{email}|{ip}", 0) > now or _locked_until.get(email, 0) > now:
            return False, "Too many failed attempts for this account. Please try again in 15 minutes."
    return True, ""


def record_failure(email: str, ip: str) -> None:
    now = time.time()
    with _lock:
        for key, limit, window in (
            (f"{email}|{ip}", MAX_FAILURES_PER_ACCOUNT_NETWORK, LOCK_SECONDS),
            (email, MAX_FAILURES_PER_ACCOUNT, ACCOUNT_WINDOW_SECONDS),
        ):
            recent = [t for t in _failures.get(key, []) if now - t < window]
            recent.append(now)
            _failures[key] = recent
            if len(recent) >= limit:
                _locked_until[key] = now + LOCK_SECONDS
                _failures[key] = []
        _prune(now)


def record_success(email: str, ip: str) -> None:
    with _lock:
        _failures.pop(f"{email}|{ip}", None)
        _locked_until.pop(f"{email}|{ip}", None)


def reset_all() -> None:
    """Tests only."""
    with _lock:
        _failures.clear()
        _locked_until.clear()
        _ip_attempts.clear()
