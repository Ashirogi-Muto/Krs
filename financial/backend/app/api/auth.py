"""Authentication endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, UserResponse
from app.services.auth_service import verify_password, create_access_token, decode_access_token
from app.api.deps import get_current_user
from app.services import login_guard

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=UserResponse)
def login(
    login_data: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Authenticate user and issue HttpOnly session cookie."""
    email = login_data.email.strip().lower()
    allowed, reason = login_guard.check_allowed(email, login_guard.client_ip(request))
    if not allowed:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=reason)
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        login_guard.record_failure(email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    login_guard.record_success(email)
    token = create_access_token(user_id=user.id, role=user.role, session_version=int(user.session_version or 0))

    # Browser-session cookie (no max-age): closing the browser signs out. The token itself expires after
    # SESSION_IDLE_MINUTES of inactivity and at most SESSION_EXPIRE_HOURS after sign-in.
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.is_cookie_secure,
        samesite=settings.COOKIE_SAMESITE,
        path="/"
    )

    return user

@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    """End the session: the user's session_version is bumped, so every token issued before stops working
    (signs the user out on all devices), then the cookie is cleared."""
    payload = decode_access_token(request.cookies.get(settings.COOKIE_NAME) or "")
    if payload:
        user = db.query(User).filter(User.id == payload.get("sub")).first()
        if user and int(payload.get("sv", 0)) == int(user.session_version or 0):
            user.session_version = int(user.session_version or 0) + 1
            db.commit()
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        path="/",
        secure=settings.is_cookie_secure,
        samesite=settings.COOKIE_SAMESITE
    )
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve currently authenticated user identity and role."""
    return current_user
