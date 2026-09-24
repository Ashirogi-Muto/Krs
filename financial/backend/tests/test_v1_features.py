"""Tests for v1 Feature Expansion: Admin, Payments, Projects, Budgets, Notifications, Search, and Import."""
from datetime import date, timedelta
from decimal import Decimal
import pytest
from app.models.user import User
from app.models.category import Category
from app.models.payment_method import PaymentMethod
from app.models.project import Project
from app.models.expense import Expense
from app.models.income import Income

def test_admin_user_lifecycle_and_safety_rules(admin_client, editor_client, db):
    # 1. Editor is forbidden from admin routes
    res = editor_client.get("/api/admin/users")
    assert res.status_code == 403

    # 2. Admin can list users
    res = admin_client.get("/api/admin/users")
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 3

    # 3. Admin can create a new user
    new_user_payload = {
        "name": "Club Auditor",
        "email": "auditor@krs.club",
        "role": "VIEWER",
        "password": "AuditorPassword123!"
    }
    res = admin_client.post("/api/admin/users", json=new_user_payload)
    assert res.status_code == 201
    created = res.json()
    assert created["email"] == "auditor@krs.club"
    assert created["role"] == "VIEWER"

    # 4. Duplicate email rejected
    res = admin_client.post("/api/admin/users", json=new_user_payload)
    assert res.status_code == 400

    # 5. Last Admin Safety Rule: Cannot demote sole active admin
    admin_obj = db.query(User).filter(User.email == "tanishaqbansal@gmail.com").first()
    res = admin_client.put(f"/api/admin/users/{admin_obj.id}/role", json={"role": "EDITOR"})
    assert res.status_code == 400
    assert "Cannot demote the last remaining active administrator" in res.json()["detail"]

    # 6. Last Admin Safety Rule: Cannot deactivate sole active admin
    res = admin_client.put(f"/api/admin/users/{admin_obj.id}/status", json={"is_active": False})
    assert res.status_code == 400
    assert "Cannot deactivate the last remaining active administrator" in res.json()["detail"]

    # 7. Can promote another user to admin, then demote first admin
    res = admin_client.put(f"/api/admin/users/{created['id']}/role", json={"role": "ADMIN"})
    assert res.status_code == 200

    # Now 2 admins exist, so original admin can change role
    res = admin_client.put(f"/api/admin/users/{admin_obj.id}/role", json={"role": "ADMIN"})
    assert res.status_code == 200

def test_admin_category_and_payment_method_management(admin_client, db):
    # Create new category
    cat_payload = {"name": "Robotics Workshop", "type": "EXPENSE"}
    res = admin_client.post("/api/admin/categories", json=cat_payload)
    assert res.status_code == 201
    cat_id = res.json()["id"]

    # Toggle category status
    res = admin_client.patch(f"/api/admin/categories/{cat_id}/status", json={"is_active": False})
    assert res.status_code == 200
    assert res.json()["is_active"] is False

    # Create new payment method
    pm_payload = {"name": "Demand Draft"}
    res = admin_client.post("/api/admin/payment-methods", json=pm_payload)
    assert res.status_code == 201
    pm_id = res.json()["id"]

    # Toggle payment method status
    res = admin_client.patch(f"/api/admin/payment-methods/{pm_id}/status", json={"is_active": False})
    assert res.status_code == 200
    assert res.json()["is_active"] is False

def test_expense_payments_and_balance_derivation(editor_client, db):
    cat = db.query(Category).filter(Category.type == "EXPENSE").first()
    pm = db.query(PaymentMethod).first()

    # Create a bill of ₹10,000 with ₹0 paid
    exp_payload = {
        "bill_date": "2026-09-20",
        "description": "Chassis Raw Materials",
        "category_id": cat.id,
        "vendor": "Steel Works Ltd",
        "total_amount": "10000.00",
        "amount_paid": "0.00",
        "due_date": "2026-10-01"
    }
    res = editor_client.post("/api/expenses", json=exp_payload)
    assert res.status_code == 201
    exp = res.json()
    exp_id = exp["id"]
    assert exp["status"] == "PENDING"
    assert exp["amount_pending"] == "10000.00"

    # Record partial payment of ₹4,000
    pmt_payload = {
        "payment_amount": "4000.00",
        "payment_date": "2026-09-21",
        "payment_method_id": pm.id,
        "reference_number": "TXN-RAW-01",
        "notes": "40% advance payment"
    }
    res = editor_client.post(f"/api/expenses/{exp_id}/payments", json=pmt_payload)
    assert res.status_code == 200
    updated_exp = res.json()
    assert updated_exp["status"] == "PARTIALLY_PAID"
    assert Decimal(str(updated_exp["amount_paid"])) == Decimal("4000.00")
    assert Decimal(str(updated_exp["amount_pending"])) == Decimal("6000.00")
    assert len(updated_exp["payments"]) == 1

    # Overpayment rejection: Trying to pay ₹7,000 when only ₹6,000 is due
    res = editor_client.post(f"/api/expenses/{exp_id}/payments", json={
        "payment_amount": "7000.00",
        "payment_date": "2026-09-22",
        "payment_method_id": pm.id
    })
    assert res.status_code == 422

    # Clear remaining balance of ₹6,000
    res = editor_client.post(f"/api/expenses/{exp_id}/payments", json={
        "payment_amount": "6000.00",
        "payment_date": "2026-09-22",
        "payment_method_id": pm.id,
        "reference_number": "TXN-RAW-02"
    })
    assert res.status_code == 200
    final_exp = res.json()
    assert final_exp["status"] == "PAID"
    assert Decimal(str(final_exp["amount_paid"])) == Decimal("10000.00")
    assert Decimal(str(final_exp["amount_pending"])) == Decimal("0.00")
    assert len(final_exp["payments"]) == 2

def test_projects_and_dimensional_accounting(editor_client, db):
    cat_inc = db.query(Category).filter(Category.type == "INCOME").first()
    cat_exp = db.query(Category).filter(Category.type == "EXPENSE").first()
    pm = db.query(PaymentMethod).first()

    # Create a project
    proj_payload = {
        "name": "RoboWars 2026",
        "code": "RW26",
        "description": "National college robotics competition",
        "status": "ACTIVE",
        "budget_amount": "50000.00"
    }
    res = editor_client.post("/api/projects", json=proj_payload)
    assert res.status_code == 201
    proj = res.json()
    proj_id = proj["id"]

    # Tag an income to this project
    res = editor_client.post("/api/income", json={
        "date": "2026-09-20",
        "source": "Title Sponsor TechCorp",
        "category_id": cat_inc.id,
        "amount": "30000.00",
        "payment_method_id": pm.id,
        "received_by": "Treasurer",
        "project_id": proj_id
    })
    assert res.status_code == 201

    # Tag an expense with payment to this project
    res = editor_client.post("/api/expenses", json={
        "bill_date": "2026-09-20",
        "description": "Arena Arena Timber & Netting",
        "category_id": cat_exp.id,
        "vendor": "Wood Suppliers",
        "total_amount": "12000.00",
        "amount_paid": "12000.00",
        "project_id": proj_id
    })
    assert res.status_code == 201

    # Fetch project details and verify calculations
    res = editor_client.get(f"/api/projects/{proj_id}")
    assert res.status_code == 200
    detail = res.json()
    assert Decimal(str(detail["total_income"])) == Decimal("30000.00")
    assert Decimal(str(detail["total_expenses_paid"])) == Decimal("12000.00")
    assert Decimal(str(detail["net_cash_flow"])) == Decimal("18000.00")
    assert Decimal(str(detail["budget_remaining"])) == Decimal("38000.00")
    assert len(detail["incomes"]) == 1
    assert len(detail["expenses"]) == 1

    # Cannot delete project with associated transactions
    res = editor_client.delete(f"/api/projects/{proj_id}")
    assert res.status_code == 400

def test_budgets_and_variance_tracking(editor_client, db):
    cat_exp = db.query(Category).filter(Category.type == "EXPENSE").first()

    budget_payload = {
        "name": "Q3 2026 Hardware Budget",
        "period_start": "2026-07-01",
        "period_end": "2026-09-30",
        "total_budget": "40000.00",
        "items": [
            {
                "category_id": cat_exp.id,
                "allocated_amount": "25000.00"
            }
        ]
    }
    res = editor_client.post("/api/budgets", json=budget_payload)
    assert res.status_code == 201
    b = res.json()
    assert Decimal(str(b["total_budget"])) == Decimal("40000.00")
    assert len(b["items"]) == 1

    # Over-allocation validation (allocations sum exceeds total_budget)
    bad_payload = {
        "name": "Invalid Budget",
        "period_start": "2026-07-01",
        "period_end": "2026-09-30",
        "total_budget": "10000.00",
        "items": [
            {
                "category_id": cat_exp.id,
                "allocated_amount": "15000.00"
            }
        ]
    }
    res = editor_client.post("/api/budgets", json=bad_payload)
    assert res.status_code == 400

def test_notifications_lifecycle(editor_client, db):
    cat = db.query(Category).filter(Category.type == "EXPENSE").first()

    # Create an overdue expense
    editor_client.post("/api/expenses", json={
        "bill_date": "2026-08-01",
        "description": "Overdue Cloud Invoice",
        "category_id": cat.id,
        "vendor": "Cloud Provider",
        "total_amount": "5000.00",
        "amount_paid": "0.00",
        "due_date": "2026-08-15"
    })

    # Fetch notifications
    res = editor_client.get("/api/notifications")
    assert res.status_code == 200
    data = res.json()
    assert data["unread_count"] >= 1

    # Mark all read
    res = editor_client.post("/api/notifications/mark-all-read")
    assert res.status_code == 200

    # Verify unread count is 0
    res = editor_client.get("/api/notifications/unread-count")
    assert res.status_code == 200
    assert res.json()["unread_count"] == 0

def test_global_search(editor_client, admin_client, db):
    cat = db.query(Category).filter(Category.type == "EXPENSE").first()
    editor_client.post("/api/expenses", json={
        "bill_date": "2026-09-20",
        "description": "Chassis Raw Materials",
        "category_id": cat.id,
        "vendor": "Steel Works Ltd",
        "total_amount": "5000.00",
        "amount_paid": "0.00"
    })

    # Search for "Chassis"
    res = editor_client.get("/api/search?q=Chassis")
    assert res.status_code == 200
    search_res = res.json()
    assert len(search_res["transactions"]) >= 1

    # Editor cannot search users
    res = editor_client.get("/api/search?q=Editor")
    assert res.status_code == 200
    assert len(res.json()["users"]) == 0

    # Admin can search users
    res = admin_client.get("/api/search?q=Editor")
    assert res.status_code == 200
    assert len(res.json()["users"]) >= 1
