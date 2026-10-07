"""Payment service for recording partial/full payments with atomic audit logging."""
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.expense import Expense
from app.models.expense_payment import ExpensePayment
from app.models.user import User
from app.models.notification import Notification
from app.services.audit_service import record_audit

def record_expense_payment(
    db: Session,
    expense_id: str,
    amount: Decimal,
    payment_date: date,
    payment_method_id: Optional[str],
    reference_number: Optional[str],
    notes: Optional[str],
    actor: User
) -> ExpensePayment:
    """Record an individual payment on an expense with balance validation and atomic audit."""
    if amount <= Decimal("0.00"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Payment amount must be greater than zero."
        )

    # Row lock until commit: two payments recorded at the same moment can't both pass the balance check (overpay)
    expense = db.query(Expense).filter(
        (Expense.id == expense_id) | (Expense.transaction_id == expense_id)
    ).with_for_update().first()

    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense transaction not found.")

    if expense.status == "CANCELLED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot record payments on a cancelled expense.")

    # Calculate existing total paid from individual payments
    existing_paid = db.query(func.coalesce(func.sum(ExpensePayment.amount), Decimal("0.00"))).filter(
        ExpensePayment.expense_id == expense.id
    ).scalar()
    existing_paid = Decimal(str(existing_paid))

    tot = Decimal(str(expense.total_amount))
    new_total_paid = existing_paid + amount
    remaining_due = max(Decimal("0.00"), tot - existing_paid)

    if new_total_paid > tot:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Payment of ₹{amount} exceeds remaining balance of ₹{remaining_due} (Total Bill: ₹{tot}, Already Paid: ₹{existing_paid})."
        )

    # Insert payment record
    payment = ExpensePayment(
        id=str(uuid.uuid4()),
        expense_id=expense.id,
        amount=amount,
        payment_date=payment_date,
        payment_method_id=payment_method_id,
        reference_number=reference_number,
        notes=notes,
        created_by=actor.id
    )
    db.add(payment)
    db.flush()

    # Update aggregate expense state
    prev_status = expense.status
    prev_paid = expense.amount_paid
    prev_pending = expense.amount_pending

    expense.amount_paid = new_total_paid
    if new_total_paid >= tot:
        expense.status = "PAID"
    else:
        expense.status = "PARTIALLY_PAID"

    expense.payment_date = payment_date
    if payment_method_id:
        expense.payment_method_id = payment_method_id
    if reference_number:
        expense.reference_number = reference_number

    db.flush()

    # Record audit log
    record_audit(
        db=db,
        user_id=actor.id,
        user_name=actor.name,
        action="PAYMENT_CREATED",
        entity_type="EXPENSE",
        entity_id=expense.transaction_id,
        before_data={
            "amount_paid": float(prev_paid),
            "amount_pending": float(prev_pending),
            "status": prev_status
        },
        after_data={
            "payment_id": payment.id,
            "payment_amount": float(amount),
            "new_amount_paid": float(expense.amount_paid),
            "new_amount_pending": float(expense.amount_pending),
            "new_status": expense.status,
            "payment_date": payment_date.isoformat(),
            "reference_number": reference_number
        }
    )

    # Create notification for editors and admins
    privileged_users = db.query(User).filter(User.role.in_(["EDITOR", "ADMIN"]), User.is_active == True).all()
    for u in privileged_users:
        if u.id != actor.id:
            notif = Notification(
                user_id=u.id,
                type="PAYMENT_RECORDED",
                title=f"Payment Recorded: {expense.transaction_id}",
                message=f"₹{amount} payment recorded by {actor.name} for {expense.description}. Remaining due: ₹{expense.amount_pending}.",
                entity_type="EXPENSE",
                entity_id=expense.transaction_id
            )
            db.add(notif)

    db.commit()
    db.refresh(payment)
    return payment

def get_expense_payments(db: Session, expense_id: str) -> List[ExpensePayment]:
    """Retrieve all payments for an expense ordered by date descending."""
    return db.query(ExpensePayment).filter(
        ExpensePayment.expense_id == expense_id
    ).order_by(ExpensePayment.payment_date.desc(), ExpensePayment.created_at.desc()).all()
