"""Security fixes of 7 Oct 2026 (docs/SECURITY_FIX_PLAN.md, section B)."""
import io
import time
from decimal import Decimal

import pytest
from openpyxl import Workbook

from app.models.category import Category
from app.models.expense import Expense
from app.models.user import User
from app.services import login_guard
from app.services.auth_service import verify_login_password, hash_password
from app.services.report_service import neutralise_formulas
from app.api.documents import content_disposition
from app.provision import provision_accounts

VALID_PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"


@pytest.fixture(autouse=True)
def _clean_guard():
    login_guard.reset_all()
    yield
    login_guard.reset_all()


def _expense(editor_client, db, total="1000.00", paid="0.00", description="Motor drivers"):
    cat = db.query(Category).filter(Category.type == "EXPENSE").first()
    r = editor_client.post("/api/expenses", json={
        "bill_date": "2026-10-01", "description": description, "category_id": cat.id,
        "vendor": "Robu", "total_amount": total, "amount_paid": paid,
    })
    assert r.status_code == 201, r.text
    return r.json()


# --- B1: lockout per account + network -------------------------------------------------------------------------

def test_network_key_groups_ipv6_by_64():
    assert login_guard.network_key("203.0.113.9") == "203.0.113.9"
    assert login_guard.network_key("2401:4900:81f8:238:e8b6:dfff:fe1c:f5a9") == "2401:4900:81f8:238::/64"
    assert login_guard.network_key("2401:4900:81f8:238::1") == login_guard.network_key("2401:4900:81f8:238::ffff")
    assert login_guard.network_key("::ffff:198.51.100.4") == "198.51.100.4"
    assert login_guard.network_key("garbage") == "garbage"


def test_guessing_from_one_network_does_not_lock_out_the_owner(client, db):
    db.add(User(name="Owner", email="owner.lock", password_hash=hash_password("Owner-Pass-12345"), role="VIEWER", is_active=True))
    db.commit()
    attacker = {"X-Real-IP": "198.51.100.66"}
    for _ in range(5):
        assert client.post("/api/auth/login", json={"email": "owner.lock", "password": "wrong-guess-123"}, headers=attacker).status_code == 401
    # the attacker's network is locked out for this account...
    assert client.post("/api/auth/login", json={"email": "owner.lock", "password": "Owner-Pass-12345"}, headers=attacker).status_code == 429
    # ...but the owner, from their own network, still gets in
    r = client.post("/api/auth/login", json={"email": "owner.lock", "password": "Owner-Pass-12345"}, headers={"X-Real-IP": "203.0.113.5"})
    assert r.status_code == 200


def test_distributed_guessing_locks_the_account(client, db):
    db.add(User(name="Spread", email="spread.lock", password_hash=hash_password("Spread-Pass-12345"), role="VIEWER", is_active=True))
    db.commit()
    for i in range(login_guard.MAX_FAILURES_PER_ACCOUNT):
        ip = f"198.51.{100 + i // 4}.{i % 4 + 1}"  # 4 tries per network, never 5
        assert client.post("/api/auth/login", json={"email": "spread.lock", "password": "wrong-guess-123"}, headers={"X-Real-IP": ip}).status_code == 401
    r = client.post("/api/auth/login", json={"email": "spread.lock", "password": "Spread-Pass-12345"}, headers={"X-Real-IP": "203.0.113.77"})
    assert r.status_code == 429


# --- B2: no username oracle --------------------------------------------------------------------------------------

def test_unknown_username_still_runs_a_password_check():
    assert verify_login_password("anything", None) is False
    t0 = time.perf_counter()
    verify_login_password("anything", None)
    unknown = time.perf_counter() - t0
    real = hash_password("Real-Pass-12345")
    t0 = time.perf_counter()
    verify_login_password("wrong", real)
    known = time.perf_counter() - t0
    # both do one Argon2 verification (tens of ms); before the fix the unknown path took ~0
    assert unknown > known / 4


# --- B4/B5: document stream headers --------------------------------------------------------------------------

def test_content_disposition_is_safe_for_any_filename():
    h = content_disposition('बिल "मार्च".pdf\r\nX-Evil: 1')
    assert "\r" not in h and "\n" not in h
    h.encode("latin-1")  # must be a valid header value
    assert "filename*=UTF-8''" in h
    assert content_disposition("receipt.pdf") .startswith('inline; filename="receipt.pdf"')


def test_non_english_filename_streams_and_can_be_framed_by_the_portal(editor_client, viewer_client, db):
    exp = _expense(editor_client, db)
    up = editor_client.post(
        "/api/documents/upload",
        data={"entity_type": "EXPENSE", "entity_id": exp["id"]},
        files={"file": ("बिल.pdf", io.BytesIO(VALID_PDF_BYTES), "application/pdf")},
    )
    assert up.status_code == 201, up.text
    r = viewer_client.get(f"/api/documents/{up.json()['id']}/stream")
    assert r.status_code == 200
    assert r.headers["X-Frame-Options"] == "SAMEORIGIN"
    assert "frame-ancestors 'self'" in r.headers["Content-Security-Policy"]
    assert r.headers["Cache-Control"] == "private, no-store"
    # other API responses still refuse framing completely
    assert viewer_client.get("/api/auth/me").headers["X-Frame-Options"] == "DENY"


def test_upload_size_is_enforced(editor_client, db, monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "MAX_UPLOAD_SIZE_BYTES", 1024)
    exp = _expense(editor_client, db)
    r = editor_client.post(
        "/api/documents/upload",
        data={"entity_type": "EXPENSE", "entity_id": exp["id"]},
        files={"file": ("big.pdf", io.BytesIO(VALID_PDF_BYTES + b"0" * 4096), "application/pdf")},
    )
    assert r.status_code == 400 and "maximum" in r.json()["detail"]


# --- B8: spreadsheet formulas ----------------------------------------------------------------------------------

def test_excel_text_starting_with_equals_is_not_a_formula():
    wb = Workbook()
    ws = wb.active
    ws["A1"] = '=HYPERLINK("http://evil.example","click")'
    ws["A2"] = "Normal vendor"
    assert ws["A1"].data_type == "f"
    assert neutralise_formulas(wb) == 1
    assert ws["A1"].data_type == "s" and ws["A2"].data_type == "s"


def test_excel_report_downloads_and_needs_the_csrf_header(editor_client, db):
    _expense(editor_client, db, description="=1+1 vendor note")
    assert editor_client.post("/api/reports/excel").status_code == 200
    no_header = editor_client.post("/api/reports/excel", headers={"X-Requested-With": ""})
    assert no_header.status_code == 403


# --- B9: search wildcards --------------------------------------------------------------------------------------

def test_search_treats_percent_literally(editor_client, viewer_client, db):
    _expense(editor_client, db, description="Discount 50% batteries")
    _expense(editor_client, db, description="Plain batteries")
    r = viewer_client.get("/api/search", params={"q": "50%"})
    assert r.status_code == 200
    titles = [t["title"] for t in r.json()["transactions"]]
    assert any("50%" in t for t in titles)
    r2 = viewer_client.get("/api/search", params={"q": "%"})
    assert all("%" in t["title"] for t in r2.json()["transactions"])


# --- B10: paid amount only through payments -------------------------------------------------------------------

def test_expense_update_cannot_set_amount_paid(editor_client, db):
    exp = _expense(editor_client, db, total="1000.00")
    r = editor_client.put(f"/api/expenses/{exp['id']}", json={"amount_paid": "1000.00"})
    assert r.status_code == 422
    assert db.query(Expense).filter(Expense.id == exp["id"]).first().amount_paid == Decimal("0.00")


def test_expense_total_cannot_drop_below_paid(editor_client, db):
    exp = _expense(editor_client, db, total="1000.00", paid="600.00")
    assert editor_client.put(f"/api/expenses/{exp['id']}", json={"total_amount": "500.00"}).status_code == 422
    ok = editor_client.put(f"/api/expenses/{exp['id']}", json={"total_amount": "800.00", "vendor": "Robu.in"})
    assert ok.status_code == 200 and ok.json()["status"] == "PARTIALLY_PAID"


def test_update_and_its_audit_entry_are_saved_together(editor_client, admin_client, db):
    exp = _expense(editor_client, db)
    assert editor_client.put(f"/api/expenses/{exp['id']}", json={"vendor": "New vendor"}).status_code == 200
    logs = admin_client.get("/api/audit-logs").json()
    assert any(l["action"] == "UPDATE" and l["entity_id"] == exp["transaction_id"] for l in logs)


# --- B14: provisioning is create-only --------------------------------------------------------------------------

def test_provisioning_does_not_reactivate_or_rerole(monkeypatch, db):
    monkeypatch.setenv("ACCOUNT_TREASURER_USERNAME", "treasurer.keep")
    monkeypatch.setenv("ACCOUNT_TREASURER_PASSWORD", "Treasurer-Pass-12345")
    monkeypatch.delenv("ACCOUNT_ADMIN_USERNAME", raising=False)
    monkeypatch.delenv("ACCOUNT_PRESIDENT_USERNAME", raising=False)
    provision_accounts(db)
    u = db.query(User).filter(User.email == "treasurer.keep").first()
    assert u.role == "EDITOR" and u.is_active
    u.is_active = False
    u.role = "VIEWER"
    db.commit()
    provision_accounts(db)  # next restart / deploy
    db.expire_all()
    u = db.query(User).filter(User.email == "treasurer.keep").first()
    assert u.is_active is False and u.role == "VIEWER"
