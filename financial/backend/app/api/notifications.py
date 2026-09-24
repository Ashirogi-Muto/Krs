"""In-app notifications API router."""
from typing import Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.api.deps import get_current_user, validate_csrf
from app.schemas.notification import NotificationResponse, NotificationListResponse
from app.services.notification_service import evaluate_and_generate_due_notifications

router = APIRouter(
    prefix="/api/notifications",
    tags=["notifications"]
)

@router.get("", response_model=NotificationListResponse)
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch notifications for current user, evaluating due bills dynamically."""
    # Check for newly due or overdue bills
    evaluate_and_generate_due_notifications(db, target_user=current_user)

    items = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(
        Notification.is_read.asc(),
        Notification.created_at.desc()
    ).limit(50).all()

    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    return NotificationListResponse(
        unread_count=unread_count,
        items=items
    )

@router.get("/unread-count", response_model=Dict[str, int])
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Quick badge count of unread notifications."""
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"unread_count": unread_count}

@router.patch("/{notification_id}/read", response_model=NotificationResponse, dependencies=[Depends(validate_csrf)])
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a specific notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.post("/mark-all-read", response_model=Dict[str, int], dependencies=[Depends(validate_csrf)])
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all unread notifications as read for current user."""
    updated = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"marked_read": updated}
