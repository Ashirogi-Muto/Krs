"""In-app notification service with deduplication and due-date evaluation."""
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.expense import Expense
from app.models.user import User

def create_notification(
    db: Session,
    user_id: str,
    type: str,
    title: str,
    message: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None
) -> Optional[Notification]:
    """Create a notification with deduplication to prevent repetitive spam."""
    existing_unread = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.type == type,
        Notification.entity_id == entity_id,
        Notification.is_read == False
    ).first()

    if existing_unread:
        return existing_unread

    notif = Notification(
        id=str(uuid.uuid4()),
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

def evaluate_and_generate_due_notifications(db: Session, target_user: Optional[User] = None) -> int:
    """Scan active expenses and generate DUE_SOON / OVERDUE_BILL alerts for authorized users."""
    today = date.today()
    pending_expenses = db.query(Expense).filter(
        Expense.status.notin_(["PAID", "CANCELLED"]),
        Expense.due_date.isnot(None)
    ).all()

    if target_user:
        recipient_users = [target_user]
    else:
        recipient_users = db.query(User).filter(
            User.role.in_(["EDITOR", "ADMIN"]),
            User.is_active == True
        ).all()

    created_count = 0
    for exp in pending_expenses:
        if exp.amount_pending <= Decimal("0.00"):
            continue

        days_diff = (exp.due_date - today).days

        if days_diff < 0:
            # Overdue
            title = f"Overdue Bill: {exp.transaction_id}"
            msg = f"{exp.transaction_id} ({exp.description}) from {exp.vendor} is overdue by {abs(days_diff)} days. Balance due: ₹{exp.amount_pending}."
            n_type = "OVERDUE_BILL"
        elif 0 <= days_diff <= 3:
            # Due Soon
            title = f"Bill Due Soon: {exp.transaction_id}"
            msg = f"{exp.transaction_id} ({exp.description}) is due in {days_diff} day{'s' if days_diff != 1 else ''}. Balance due: ₹{exp.amount_pending}."
            n_type = "DUE_SOON"
        else:
            continue

        for u in recipient_users:
            res = create_notification(
                db=db,
                user_id=u.id,
                type=n_type,
                title=title,
                message=msg,
                entity_type="EXPENSE",
                entity_id=exp.transaction_id
            )
            if res:
                created_count += 1

    return created_count
