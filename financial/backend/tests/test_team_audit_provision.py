"""Viewer management by the treasurer, admin-only audit trail, and env-provisioned accounts."""
from app.models.user import User
from app.models.audit_log import AuditLog
from app.provision import provision_accounts

H = {"X-Requested-With": "XMLHttpRequest"}


def test_audit_trail_is_admin_only(admin_client, editor_client, viewer_client):
    assert admin_client.get("/api/audit-logs", headers=H).status_code == 200
    assert editor_client.get("/api/audit-logs", headers=H).status_code == 403
    assert viewer_client.get("/api/audit-logs", headers=H).status_code == 403


def test_editor_manages_viewers_only(editor_client, db):
    r = editor_client.post("/api/team/viewers", headers=H, json={"name": "Faculty Viewer", "username": "faculty.view", "password": "Viewer-Pass-12345"})
    assert r.status_code == 201, r.text
    assert r.json()["role"] == "VIEWER"
    listed = editor_client.get("/api/team/viewers", headers=H).json()
    assert {u["role"] for u in listed} == {"VIEWER"}  # editors never see EDITOR / ADMIN accounts
    vid = r.json()["id"]
    assert editor_client.put(f"/api/team/viewers/{vid}/status", headers=H, json={"is_active": False}).json()["is_active"] is False
    # an editor cannot touch a non-viewer account through these routes
    admin = db.query(User).filter(User.role == "ADMIN").first()
    assert editor_client.put(f"/api/team/viewers/{admin.id}/status", headers=H, json={"is_active": False}).status_code == 404
    # and still cannot use the admin user-management API
    assert editor_client.get("/api/admin/users", headers=H).status_code == 403
    assert db.query(AuditLog).filter(AuditLog.action == "VIEWER_CREATED").count() >= 1


def test_viewer_cannot_manage_viewers(viewer_client):
    assert viewer_client.get("/api/team/viewers", headers=H).status_code == 403


def test_provision_accounts_from_env(monkeypatch, db):
    monkeypatch.setenv("ACCOUNT_TREASURER_USERNAME", "treasurer")
    monkeypatch.setenv("ACCOUNT_TREASURER_PASSWORD", "Treasurer-Pass-12345")
    monkeypatch.setenv("ACCOUNT_PRESIDENT_USERNAME", "president")
    monkeypatch.setenv("ACCOUNT_PRESIDENT_PASSWORD", "short")  # too short -> skipped
    monkeypatch.delenv("ACCOUNT_ADMIN_USERNAME", raising=False)
    provision_accounts(db)
    db.expire_all()
    t = db.query(User).filter(User.email == "treasurer").first()
    assert t is not None and t.role == "EDITOR"
    assert db.query(User).filter(User.email == "president").first() is None
    # changing the env password updates the account and is audited (without the password)
    monkeypatch.setenv("ACCOUNT_TREASURER_PASSWORD", "Treasurer-Pass-67890")
    provision_accounts(db)
    db.expire_all()
    log = db.query(AuditLog).filter(AuditLog.action == "ACCOUNT_UPDATED_FROM_ENV").first()
    assert log is not None and "Treasurer-Pass" not in str(log.after_data)


def test_login_with_username(monkeypatch, client, db):
    monkeypatch.setenv("ACCOUNT_PRESIDENT_USERNAME", "president2")
    monkeypatch.setenv("ACCOUNT_PRESIDENT_PASSWORD", "President-Pass-12345")
    provision_accounts(db)
    r = client.post("/api/auth/login", json={"email": "president2", "password": "President-Pass-12345"})
    assert r.status_code == 200 and r.json()["role"] == "VIEWER"
