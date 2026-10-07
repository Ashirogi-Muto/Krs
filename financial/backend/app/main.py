"""Main FastAPI application entrypoint with security middleware and rotating logs."""
import json
import logging
from logging.handlers import RotatingFileHandler
import os
import time
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings
from app.services.auth_service import decode_access_token, refresh_access_token
from app.api import api_router

# 1. SETUP LOGGING
log_dir = Path(settings.LOG_DIR)
log_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / "backend.log"

logger = logging.getLogger("krs_financial")
logger.setLevel(logging.INFO)

# 10MB max size, 5 rotating files
file_handler = RotatingFileHandler(
    filename=str(log_file),
    maxBytes=10 * 1024 * 1024,
    backupCount=5,
    encoding="utf-8"
)
formatter = logging.Formatter(
    '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "module": "%(module)s", "message": %(message)s}'
)
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

# Also console output for local dev
console_handler = logging.StreamHandler()
console_handler.setFormatter(logging.Formatter('[%(levelname)s] %(message)s'))
logger.addHandler(console_handler)

# 2. CREATE APP
app = FastAPI(
    title="Kalam Robotics Society Financial API",
    description="Centralized financial ledger API for Kalam Robotics Society (KRS)",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None
)

# 3. SECURITY HEADERS & REQUEST LOGGING MIDDLEWARE
class SecurityAndLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time_ms = round((time.time() - start_time) * 1000, 2)

        # Apply standard security headers. Document previews are shown in an iframe of the portal itself, so the
        # stream endpoint may be framed by the same site (it sets its own SAMEORIGIN header); nothing else can be.
        path = request.url.path
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Log request (masking sensitive endpoints or secrets). json.dumps: a path can't break the log line.
        if not path.startswith("/api/documents/") or not path.endswith("/stream"):
            logger.info(json.dumps({"method": request.method, "path": path, "status": response.status_code, "latency_ms": process_time_ms}))

        return response

class SessionRefreshMiddleware(BaseHTTPMiddleware):
    """Sliding sessions: a successful request with a valid session cookie gets a fresh token, so the
    SESSION_IDLE_MINUTES timer restarts; the absolute SESSION_EXPIRE_HOURS limit still applies."""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        token = request.cookies.get(settings.COOKIE_NAME)
        path = request.url.path
        if token and response.status_code < 400 and path.startswith("/api/") and not path.startswith("/api/auth/logout") and not path.startswith("/api/auth/login"):
            payload = decode_access_token(token)
            fresh = refresh_access_token(payload) if payload else None
            if fresh:
                response.set_cookie(
                    key=settings.COOKIE_NAME, value=fresh, httponly=True, secure=settings.is_cookie_secure,
                    samesite=settings.COOKIE_SAMESITE, path="/",
                )
        return response

app.add_middleware(SessionRefreshMiddleware)
app.add_middleware(SecurityAndLoggingMiddleware)

# 4. CORS CONFIGURATION (Strict with Credentials)
origins = [settings.FRONTEND_URL]
if settings.ENVIRONMENT != "production":
    origins.extend([
        "http://localhost:3050",
        "http://127.0.0.1:3050",
        "http://localhost:3000"
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

# 5. GLOBAL EXCEPTION HANDLER (Mask internal details in production)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(json.dumps({"error": "Unhandled exception", "path": request.url.path, "detail": str(exc)[:500]}))
    if settings.ENVIRONMENT == "production":
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal server error occurred. Please contact the administrator."}
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)}
    )

# 6. HEALTH CHECK
@app.on_event("startup")
def _provision_accounts_on_startup() -> None:
    from app.provision import provision_accounts
    provision_accounts()


@app.get("/api/instance", tags=["Health"])
def instance_info():
    """Public: which ledger this is (LEDGER_NAME), shown in the UI header and login page."""
    return {"name": os.environ.get("LEDGER_NAME", "Ledger")}


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "KRS Financial Management API",
        "environment": settings.ENVIRONMENT
    }

# 7. ATTACH ROUTER
app.include_router(api_router)
