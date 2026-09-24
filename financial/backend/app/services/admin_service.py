"""Administrative management service for users, categories, and payment methods."""
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.category import Category
from app.models.payment_method import PaymentMethod
from app.schemas.admin import (
    UserCreate,
    CategoryCreate,
    PaymentMethodCreate
)
from app.services.auth_service import hash_password
from app.services.audit_service import record_audit

def list_users(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None
) -> List[User]:
    """Retrieve users list with optional search filter."""
    query = db.query(User)
    if search:
        term = f"%{search.strip().lower()}%"
        query = query.filter((User.name.ilike(term)) | (User.email.ilike(term)))
    return query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

def count_users(db: Session, search: Optional[str] = None) -> int:
    """Count total users matching search criteria."""
    query = db.query(User)
    if search:
        term = f"%{search.strip().lower()}%"
        query = query.filter((User.name.ilike(term)) | (User.email.ilike(term)))
    return query.count()

def create_user(
    db: Session,
    user_in: UserCreate,
    actor: User
) -> User:
    """Create a new user account with role assignment."""
    email_clean = user_in.email.strip().lower()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{email_clean}' already exists."
        )

    user = User(
        name=user_in.name.strip(),
        email=email_clean,
        password_hash=hash_password(user_in.password),
        role=user_in.role,
        is_active=True
    )
    db.add(user)
    db.flush()

    record_audit(
        db=db,
        user_id=actor.id,
        user_name=actor.name,
        action="USER_CREATED",
        entity_type="USER",
        entity_id=user.id,
        before_data=None,
        after_data={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active
        }
    )
    db.commit()
    db.refresh(user)
    return user

def update_user_role(
    db: Session,
    user_id: str,
    new_role: str,
    actor: User
) -> User:
    """Update role for a user, enforcing Last Admin Safety Rule."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.role == new_role:
        return user

    # Last Admin Safety Rule
    if user.role == "ADMIN" and new_role != "ADMIN":
        active_admins_count = db.query(User).filter(
            User.role == "ADMIN",
            User.is_active == True
        ).count()
        if active_admins_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the last remaining active administrator."
            )

    before_role = user.role
    user.role = new_role
    user.updated_at = datetime.now(timezone.utc)
    db.flush()

    record_audit(
        db=db,
        user_id=actor.id,
        user_name=actor.name,
        action="USER_ROLE_UPDATED",
        entity_type="USER",
        entity_id=user.id,
        before_data={"role": before_role},
        after_data={"role": new_role, "email": user.email}
    )
    db.commit()
    db.refresh(user)
    return user

def update_user_status(
    db: Session,
    user_id: str,
    is_active: bool,
    actor: User
) -> User:
    """Toggle user active status, enforcing Last Admin Safety Rule."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.is_active == is_active:
        return user

    # Last Admin Safety Rule
    if user.role == "ADMIN" and not is_active:
        active_admins_count = db.query(User).filter(
            User.role == "ADMIN",
            User.is_active == True
        ).count()
        if active_admins_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate the last remaining active administrator."
            )

    before_status = user.is_active
    user.is_active = is_active
    user.updated_at = datetime.now(timezone.utc)
    db.flush()

    record_audit(
        db=db,
        user_id=actor.id,
        user_name=actor.name,
        action="USER_STATUS_TOGGLED",
        entity_type="USER",
        entity_id=user.id,
        before_data={"is_active": before_status},
        after_data={"is_active": is_active, "email": user.email}
    )
    db.commit()
    db.refresh(user)
    return user

def reset_user_password(
    db: Session,
    user_id: str,
    new_password: str,
    actor: User
) -> User:
    """Reset a user's password."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.now(timezone.utc)
    db.flush()

    record_audit(
        db=db,
        user_id=actor.id,
        user_name=actor.name,
        action="PASSWORD_RESET",
        entity_type="USER",
        entity_id=user.id,
        before_data=None,
        after_data={"email": user.email, "reset_by": actor.name}
    )
    db.commit()
    db.refresh(user)
    return user

def create_category(
    db: Session,
    cat_in: CategoryCreate,
    actor: User
) -> Category:
    """Create a new income/expense category."""
    name_clean = cat_in.name.strip()
    existing = db.query(Category).filter(
        Category.name.ilike(name_clean),
        Category.type == cat_in.type
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{cat_in.type} category '{name_clean}' already exists."
        )

    cat = Category(
        name=name_clean,
        type=cat_in.type,
        is_active=True
    )
    db.add(cat)
    db.flush()

    record_audit(
        db=db,
        user_id=actor.id,
        user_name=actor.name,
        action="CATEGORY_CREATED",
        entity_type="CATEGORY",
        entity_id=cat.id,
        before_data=None,
        after_data={"name": cat.name, "type": cat.type, "is_active": cat.is_active}
    )
    db.commit()
    db.refresh(cat)
    return cat

def update_category_status(
    db: Session,
    category_id: str,
    is_active: bool,
    actor: User
) -> Category:
    """Toggle category active status."""
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

    before_status = cat.is_active
    cat.is_active = is_active
    db.flush()

    record_audit(
        db=db,
        user_id=actor.id,
        user_name=actor.name,
        action="CATEGORY_STATUS_UPDATED",
        entity_type="CATEGORY",
        entity_id=cat.id,
        before_data={"is_active": before_status},
        after_data={"name": cat.name, "type": cat.type, "is_active": is_active}
    )
    db.commit()
    db.refresh(cat)
    return cat

def create_payment_method(
    db: Session,
    pm_in: PaymentMethodCreate,
    actor: User
) -> PaymentMethod:
    """Create a new payment method."""
    name_clean = pm_in.name.strip()
    existing = db.query(PaymentMethod).filter(
        PaymentMethod.name.ilike(name_clean)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment method '{name_clean}' already exists."
        )

    pm = PaymentMethod(name=name_clean, is_active=True)
    db.add(pm)
    db.flush()

    record_audit(
        db=db,
        user_id=actor.id,
        user_name=actor.name,
        action="PAYMENT_METHOD_CREATED",
        entity_type="PAYMENT_METHOD",
        entity_id=pm.id,
        before_data=None,
        after_data={"name": pm.name, "is_active": pm.is_active}
    )
    db.commit()
    db.refresh(pm)
    return pm

def update_payment_method_status(
    db: Session,
    method_id: str,
    is_active: bool,
    actor: User
) -> PaymentMethod:
    """Toggle payment method active status."""
    pm = db.query(PaymentMethod).filter(PaymentMethod.id == method_id).first()
    if not pm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment method not found.")

    before_status = pm.is_active
    pm.is_active = is_active
    db.flush()

    record_audit(
        db=db,
        user_id=actor.id,
        user_name=actor.name,
        action="PAYMENT_METHOD_STATUS_UPDATED",
        entity_type="PAYMENT_METHOD",
        entity_id=pm.id,
        before_data={"is_active": before_status},
        after_data={"name": pm.name, "is_active": is_active}
    )
    db.commit()
    db.refresh(pm)
    return pm
