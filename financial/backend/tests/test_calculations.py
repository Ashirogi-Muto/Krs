"""Financial calculations and integrity tests."""
from datetime import date, timedelta
from decimal import Decimal
from app.models.category import Category
from app.models.payment_method import PaymentMethod

def test_amount_pending_derivation(editor_client, db):
    cat_exp = db.query(Category).filter(Category.type == "EXPENSE").first()
    res = editor_client.post("/api/expenses", json={
        "bill_date": "2026-09-20",
        "description": "Sensors and Microcontrollers",
        "category_id": cat_exp.id,
        "vendor": "Robotics Store",
        "total_amount": "10000.00",
        "amount_paid": "4000.00"
    })
    assert res.status_code == 201
    data = res.json()
    assert Decimal(str(data["amount_pending"])) == Decimal("6000.00")
    assert data["status"] == "PARTIALLY_PAID"

def test_overpayment_rejected(editor_client, db):
    cat_exp = db.query(Category).filter(Category.type == "EXPENSE").first()
    res = editor_client.post("/api/expenses", json={
        "bill_date": "2026-09-20",
        "description": "Overpaid Item",
        "category_id": cat_exp.id,
        "vendor": "Test Vendor",
        "total_amount": "5000.00",
        "amount_paid": "6000.00"  # Invalid!
    })
    assert res.status_code == 422

def test_negative_amount_rejected(editor_client, db):
    cat_inc = db.query(Category).filter(Category.type == "INCOME").first()
    pm = db.query(PaymentMethod).first()
    res = editor_client.post("/api/income", json={
        "date": "2026-09-20",
        "source": "Invalid Negative",
        "category_id": cat_inc.id,
        "amount": "-500.00",  # Invalid!
        "payment_method_id": pm.id,
        "received_by": "Treasurer"
    })
    assert res.status_code == 422

def test_record_payment_workflow(editor_client, db):
    cat_exp = db.query(Category).filter(Category.type == "EXPENSE").first()
    pm = db.query(PaymentMethod).first()
    
    # Create bill with ₹10,000 total, ₹0 paid
    create_res = editor_client.post("/api/expenses", json={
        "bill_date": "2026-09-20",
        "description": "3D Printer Filament",
        "category_id": cat_exp.id,
        "vendor": "3D Supplies",
        "total_amount": "10000.00",
        "amount_paid": "0.00"
    })
    assert create_res.status_code == 201
    exp_id = create_res.json()["id"]
    assert create_res.json()["status"] == "PENDING"

    # 1. Partial payment of ₹3,000
    pay1_res = editor_client.post(f"/api/expenses/{exp_id}/payment", json={
        "payment_amount": "3000.00",
        "payment_date": "2026-09-21",
        "payment_method_id": pm.id,
        "notes": "Advance payment"
    })
    assert pay1_res.status_code == 200
    assert Decimal(str(pay1_res.json()["amount_paid"])) == Decimal("3000.00")
    assert Decimal(str(pay1_res.json()["amount_pending"])) == Decimal("7000.00")
    assert pay1_res.json()["status"] == "PARTIALLY_PAID"

    # 2. Overpayment attempt (₹8,000 when only ₹7,000 due)
    pay_bad = editor_client.post(f"/api/expenses/{exp_id}/payment", json={
        "payment_amount": "8000.00",
        "payment_date": "2026-09-22",
        "payment_method_id": pm.id
    })
    assert pay_bad.status_code == 422

    # 3. Final payment of remaining ₹7,000
    pay2_res = editor_client.post(f"/api/expenses/{exp_id}/payment", json={
        "payment_amount": "7000.00",
        "payment_date": "2026-09-22",
        "payment_method_id": pm.id,
        "notes": "Balance cleared"
    })
    assert pay2_res.status_code == 200
    assert Decimal(str(pay2_res.json()["amount_paid"])) == Decimal("10000.00")
    assert Decimal(str(pay2_res.json()["amount_pending"])) == Decimal("0.00")
    assert pay2_res.json()["status"] == "PAID"

def test_dynamic_overdue_derivation(editor_client, db):
    cat_exp = db.query(Category).filter(Category.type == "EXPENSE").first()
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()

    # Unpaid bill with past due date -> is_overdue == True
    res_overdue = editor_client.post("/api/expenses", json={
        "bill_date": "2026-09-01",
        "description": "Overdue Cloud Server",
        "category_id": cat_exp.id,
        "vendor": "Cloud Host",
        "total_amount": "4500.00",
        "amount_paid": "0.00",
        "due_date": yesterday
    })
    assert res_overdue.status_code == 201
    assert res_overdue.json()["is_overdue"] is True

    # Unpaid bill with future due date -> is_overdue == False
    res_future = editor_client.post("/api/expenses", json={
        "bill_date": "2026-09-15",
        "description": "Upcoming Bill",
        "category_id": cat_exp.id,
        "vendor": "Parts Co",
        "total_amount": "2000.00",
        "amount_paid": "0.00",
        "due_date": tomorrow
    })
    assert res_future.status_code == 201
    assert res_future.json()["is_overdue"] is False

    # Fully paid bill with past due date -> is_overdue == False
    res_paid = editor_client.post("/api/expenses", json={
        "bill_date": "2026-09-01",
        "description": "Cleared Bill",
        "category_id": cat_exp.id,
        "vendor": "Vendor",
        "total_amount": "3000.00",
        "amount_paid": "3000.00",
        "due_date": yesterday
    })
    assert res_paid.status_code == 201
    assert res_paid.json()["is_overdue"] is False
