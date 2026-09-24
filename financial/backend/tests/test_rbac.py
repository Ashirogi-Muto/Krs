"""Server-side RBAC authorization tests."""
from datetime import date
from decimal import Decimal
from app.models.category import Category
from app.models.payment_method import PaymentMethod

def test_viewer_read_endpoints_allowed(viewer_client):
    assert viewer_client.get("/api/dashboard").status_code == 200
    assert viewer_client.get("/api/income").status_code == 200
    assert viewer_client.get("/api/expenses").status_code == 200
    assert viewer_client.get("/api/documents").status_code == 200
    assert viewer_client.get("/api/audit-logs").status_code == 200
    assert viewer_client.get("/api/reports/export").status_code == 200

def test_viewer_cannot_create_income(viewer_client, db):
    cat = db.query(Category).filter(Category.type == "INCOME").first()
    pm = db.query(PaymentMethod).first()
    payload = {
        "date": "2026-09-20",
        "source": "Unauthorized Sponsor",
        "category_id": cat.id,
        "amount": "5000.00",
        "payment_method_id": pm.id,
        "received_by": "Viewer"
    }
    res = viewer_client.post("/api/income", json=payload)
    assert res.status_code == 403
    assert "Requires EDITOR role" in res.json()["detail"]

def test_viewer_cannot_create_expense(viewer_client, db):
    cat = db.query(Category).filter(Category.type == "EXPENSE").first()
    payload = {
        "bill_date": "2026-09-20",
        "description": "Unauthorized Purchase",
        "category_id": cat.id,
        "vendor": "Test Vendor",
        "total_amount": "12000.00",
        "amount_paid": "0.00"
    }
    res = viewer_client.post("/api/expenses", json=payload)
    assert res.status_code == 403
    assert "Requires EDITOR role" in res.json()["detail"]

def test_editor_can_create_income_and_expense(editor_client, db):
    cat_inc = db.query(Category).filter(Category.type == "INCOME").first()
    cat_exp = db.query(Category).filter(Category.type == "EXPENSE").first()
    pm = db.query(PaymentMethod).first()

    inc_res = editor_client.post("/api/income", json={
        "date": "2026-09-20",
        "source": "Club Donation",
        "category_id": cat_inc.id,
        "amount": "25000.00",
        "payment_method_id": pm.id,
        "received_by": "Treasurer"
    })
    assert inc_res.status_code == 201
    assert inc_res.json()["transaction_id"].startswith("INC-")

    exp_res = editor_client.post("/api/expenses", json={
        "bill_date": "2026-09-20",
        "description": "Robot Aluminum Chassis",
        "category_id": cat_exp.id,
        "vendor": "Metal Works",
        "total_amount": "18000.00",
        "amount_paid": "5000.00"
    })
    assert exp_res.status_code == 201
    assert exp_res.json()["transaction_id"].startswith("EXP-")
    assert exp_res.json()["status"] == "PARTIALLY_PAID"
    assert Decimal(str(exp_res.json()["amount_pending"])) == Decimal("13000.00")

def test_audit_logs_append_only_immutable(editor_client):
    # Mutation or deletion of audit logs is prohibited (endpoint absent: HTTP 404 or 405)
    res_put = editor_client.put("/api/audit-logs/any-id", json={"action": "HACK"})
    assert res_put.status_code in (404, 405)
    res_del = editor_client.delete("/api/audit-logs/any-id")
    assert res_del.status_code in (404, 405)
