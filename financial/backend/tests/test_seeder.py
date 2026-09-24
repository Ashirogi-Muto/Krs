"""Legacy Excel importer and seeder tests."""
from decimal import Decimal
from app.seed import seed_database
from app.database import SessionLocal
from app.models.income import Income
from app.models.expense import Expense

def test_seeder_import_and_idempotency():
    # Run seeder
    seed_database()
    db = SessionLocal()
    try:
        # Check INC-002
        inc = db.query(Income).filter(Income.transaction_id == "INC-002").first()
        assert inc is not None
        assert inc.source == "IILM UNIVERSITY"
        assert inc.amount == Decimal("15000.00")
        assert inc.status == "CLEARED"

        # Check EXP-001
        exp = db.query(Expense).filter(Expense.transaction_id == "EXP-001").first()
        assert exp is not None
        assert "Auditorium" in exp.description
        assert exp.total_amount == Decimal("105275.00")
        assert exp.amount_paid == Decimal("10000.00")
        assert exp.amount_pending == Decimal("95275.00")
        assert exp.status == "PARTIALLY_PAID"

        # Verify running again does not duplicate
        count_inc_before = db.query(Income).count()
        count_exp_before = db.query(Expense).count()
        seed_database()
        count_inc_after = db.query(Income).count()
        count_exp_after = db.query(Expense).count()

        assert count_inc_before == count_inc_after
        assert count_exp_before == count_exp_after
    finally:
        db.close()
