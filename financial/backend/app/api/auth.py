"""Authentication endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, UserResponse
from app.services.auth_service import verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=UserResponse)
def login(
    login_data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """Authenticate user and issue HttpOnly session cookie."""
    user = db.query(User).filter(User.email == login_data.email.strip().lower()).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    token = create_access_token(user_id=user.id, role=user.role)

    # Set secure HttpOnly cookie
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.is_cookie_secure,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.SESSION_EXPIRE_HOURS * 3600,
        path="/"
    )

    return user

@router.post("/logout")
def logout(response: Response):
    """Clear session cookie."""
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
