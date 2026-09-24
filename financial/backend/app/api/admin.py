"""Admin API Router: Users, Categories, and Payment Methods management."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.api.deps import require_admin, validate_csrf
from app.schemas.admin import (
    UserCreate,
    UserUpdateRole,
    UserUpdateStatus,
    UserResetPassword,
    UserListItem,
    CategoryCreate,
    CategoryStatusUpdate,
    CategoryResponse,
    PaymentMethodCreate,
    PaymentMethodStatusUpdate,
    PaymentMethodResponse
)
from app.services import admin_service

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin), Depends(validate_csrf)]
)

# User Management Endpoints
@router.get("/users", response_model=List[UserListItem])
def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List all registered system users with pagination and search filter."""
    return admin_service.list_users(db=db, skip=skip, limit=limit, search=search)

@router.post("/users", response_model=UserListItem, status_code=status.HTTP_201_CREATED)
def create_new_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new user account with specified role."""
    return admin_service.create_user(db=db, user_in=user_in, actor=admin)

@router.put("/users/{user_id}/role", response_model=UserListItem)
def update_user_role(
    user_id: str,
    role_in: UserUpdateRole,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Change user role (enforces Last Admin Safety Rule)."""
    return admin_service.update_user_role(db=db, user_id=user_id, new_role=role_in.role, actor=admin)

@router.put("/users/{user_id}/status", response_model=UserListItem)
def update_user_status(
    user_id: str,
    status_in: UserUpdateStatus,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Toggle user active status (enforces Last Admin Safety Rule)."""
    return admin_service.update_user_status(db=db, user_id=user_id, is_active=status_in.is_active, actor=admin)

@router.post("/users/{user_id}/reset-password", response_model=UserListItem)
def reset_user_password(
    user_id: str,
    pwd_in: UserResetPassword,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Reset user password directly as administrator."""
    return admin_service.reset_user_password(db=db, user_id=user_id, new_password=pwd_in.new_password, actor=admin)

# Category Management Endpoints
@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new income or expense category."""
    return admin_service.create_category(db=db, cat_in=cat_in, actor=admin)

@router.patch("/categories/{category_id}/status", response_model=CategoryResponse)
def toggle_category_status(
    category_id: str,
    status_in: CategoryStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Toggle category active/inactive status."""
    return admin_service.update_category_status(db=db, category_id=category_id, is_active=status_in.is_active, actor=admin)

# Payment Method Management Endpoints
@router.post("/payment-methods", response_model=PaymentMethodResponse, status_code=status.HTTP_201_CREATED)
def create_payment_method(
    pm_in: PaymentMethodCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Create a new payment method."""
    return admin_service.create_payment_method(db=db, pm_in=pm_in, actor=admin)

@router.patch("/payment-methods/{method_id}/status", response_model=PaymentMethodResponse)
def toggle_payment_method_status(
    method_id: str,
    status_in: PaymentMethodStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Toggle payment method active/inactive status."""
    return admin_service.update_payment_method_status(db=db, method_id=method_id, is_active=status_in.is_active, actor=admin)
