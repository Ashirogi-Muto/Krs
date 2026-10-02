"""Viewer management by the treasurer, admin-only audit trail, and env-provisioned accounts."""
from app.models.user import User
from app.models.audit_log import AuditLog
from app.provision import provision_accounts
from app.set_password import set_password

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
    # a changed env password never overwrites an existing account's password
    old_hash = t.password_hash
    monkeypatch.setenv("ACCOUNT_TREASURER_PASSWORD", "Treasurer-Pass-67890")
    provision_accounts(db)
    db.expire_all()
    assert db.query(User).filter(User.email == "treasurer").first().password_hash == old_hash


def test_login_with_username(monkeypatch, client, db):
    monkeypatch.setenv("ACCOUNT_PRESIDENT_USERNAME", "president2")
    monkeypatch.setenv("ACCOUNT_PRESIDENT_PASSWORD", "President-Pass-12345")
    provision_accounts(db)
    r = client.post("/api/auth/login", json={"email": "president2", "password": "President-Pass-12345"})
    assert r.status_code == 200 and r.json()["role"] == "VIEWER"


def test_only_admin_resets_passwords(admin_client, editor_client, viewer_client, db):
    vid = editor_client.post("/api/team/viewers", headers=H, json={"name": "Reset Viewer", "username": "v.reset", "password": "Viewer-Pass-12345"}).json()["id"]
    body = {"new_password": "Another-Pass-12345"}
    # the treasurer (EDITOR) and viewers have no reset route
    assert editor_client.post(f"/api/team/viewers/{vid}/reset-password", headers=H, json=body).status_code in (404, 405)
    assert editor_client.post(f"/api/admin/users/{vid}/reset-password", headers=H, json=body).status_code == 403
    assert viewer_client.post(f"/api/admin/users/{vid}/reset-password", headers=H, json=body).status_code == 403
    # the admin can, with 12+ characters
    assert admin_client.post(f"/api/admin/users/{vid}/reset-password", headers=H, json={"new_password": "short-pw"}).status_code == 422
    assert admin_client.post(f"/api/admin/users/{vid}/reset-password", headers=H, json=body).status_code == 200


def test_server_cli_reset(client, db):
    import pytest
    db.add(User(name="CLI", email="cli.user", password_hash="x", role="VIEWER", is_active=True))
    db.commit()
    with pytest.raises(ValueError):
        set_password("cli.user", "short", db=db)
    with pytest.raises(LookupError):
        set_password("nobody", "Long-Enough-Pass-1", db=db)
    set_password("CLI.user", "Long-Enough-Pass-1", db=db)
    assert client.post("/api/auth/login", json={"email": "cli.user", "password": "Long-Enough-Pass-1"}).status_code == 200
    log = db.query(AuditLog).filter(AuditLog.action == "PASSWORD_RESET", AuditLog.user_name == "SERVER CLI").first()
    assert log is not None and "Long-Enough" not in str(log.after_data)
