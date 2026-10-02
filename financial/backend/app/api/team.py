"""Viewer account management for the treasurer (EDITOR) and the financial audit (ADMIN).

Editors can only list, create and deactivate/reactivate VIEWER accounts. They never see EDITOR or ADMIN
accounts (the audit account stays invisible). Every change is in the audit trail.
Passwords of existing accounts can only be reset by the ADMIN (/api/admin) or on the server (app.set_password).
"""
import re
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.api.deps import require_editor, validate_csrf
from app.database import get_db
from app.models.user import User
from app.schemas.admin import UserListItem
from app.services.audit_service import record_audit
from app.services.auth_service import hash_password

router = APIRouter(prefix="/api/team/viewers", tags=["Viewer accounts"], dependencies=[Depends(validate_csrf)])


class ViewerCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=12, max_length=128)

    @field_validator("username")
    @classmethod
    def check_username(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.fullmatch(r"[a-z0-9._-]{3,64}", v):
            raise ValueError("Username: 3-64 letters, digits, '.', '_' or '-'")
        return v


class ViewerStatus(BaseModel):
    is_active: bool


def _viewer_or_404(db: Session, user_id: str) -> User:
    user = db.query(User).filter(User.id == user_id, User.role == "VIEWER").first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Viewer account not found")
    return user


@router.get("", response_model=List[UserListItem])
def list_viewers(db: Session = Depends(get_db), current: User = Depends(require_editor)):
    return db.query(User).filter(User.role == "VIEWER").order_by(User.created_at).all()


@router.post("", response_model=UserListItem, status_code=status.HTTP_201_CREATED)
def create_viewer(body: ViewerCreate, db: Session = Depends(get_db), current: User = Depends(require_editor)):
    if db.query(User).filter(User.email == body.username).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That username is already taken")
    user = User(name=body.name.strip(), email=body.username, password_hash=hash_password(body.password), role="VIEWER", is_active=True)
    db.add(user)
    db.flush()
    record_audit(db, current.id, current.name, "VIEWER_CREATED", "USER", user.id, None, {"username": user.email, "name": user.name})
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}/status", response_model=UserListItem)
def set_viewer_status(user_id: str, body: ViewerStatus, db: Session = Depends(get_db), current: User = Depends(require_editor)):
    user = _viewer_or_404(db, user_id)
    before = user.is_active
    user.is_active = body.is_active
    record_audit(db, current.id, current.name, "VIEWER_STATUS", "USER", user.id, {"is_active": before}, {"is_active": body.is_active})
    db.commit()
    db.refresh(user)
    return user

