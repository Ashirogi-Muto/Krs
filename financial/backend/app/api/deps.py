"""API Dependencies: Authentication, RBAC, and CSRF protection."""
from typing import Optional, Callable
from fastapi import Request, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.services.auth_service import decode_access_token

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """Extract and authenticate the active user via HttpOnly cookie or Authorization header."""
    token: Optional[str] = request.cookies.get(settings.COOKIE_NAME)
    
    # Fallback to Authorization header for programmatic tests or mobile clients
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication session required. Please log in."
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token invalid or expired. Please log in again."
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token payload"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account does not exist or has been deactivated"
        )

    return user

ROLE_LEVELS = {
    "VIEWER": 1,
    "EDITOR": 2,
    "ADMIN": 3
}

def require_role(min_role: str) -> Callable[[User], User]:
    """Server-side RBAC dependency factory supporting role hierarchy."""
    min_level = ROLE_LEVELS.get(min_role, 1)

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_level = ROLE_LEVELS.get(current_user.role, 0)
        if user_level < min_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation restricted. Requires {min_role} role."
            )
        return current_user

    return role_checker

require_editor = require_role("EDITOR")
require_admin = require_role("ADMIN")

def validate_csrf(request: Request) -> None:
    """Enforce CSRF header check on state-mutating requests when authenticated via cookies."""
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        # If authenticated via cookie, require X-Requested-With or X-CSRF-Token
        if settings.COOKIE_NAME in request.cookies:
            custom_header = request.headers.get("X-Requested-With") or request.headers.get("X-CSRF-Token")
            if not custom_header:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF validation failed: Missing custom request header"
                )
