"""Session security: browser-session cookie, idle timeout, absolute limit, sign-out / password reset end sessions."""
from datetime import timedelta
from app.config import settings
from app.models.user import User
from app.services.auth_service import create_access_token, decode_access_token, refresh_access_token, hash_password

H = {"X-Requested-With": "XMLHttpRequest"}


def _login(client, db, email="sess.user", pw="Session-Pass-12345"):
    if not db.query(User).filter(User.email == email).first():
        db.add(User(name="Sess User", email=email, password_hash=hash_password(pw), role="VIEWER", is_active=True))
        db.commit()
    r = client.post("/api/auth/login", json={"email": email, "password": pw})
    assert r.status_code == 200, r.text
    return r


def test_login_cookie_is_browser_session_only(client, db):
    r = _login(client, db)
    cookie = r.headers.get("set-cookie", "").lower()
    assert settings.COOKIE_NAME in cookie
    assert "max-age" not in cookie and "expires" not in cookie  # closing the browser ends it


def test_token_expires_after_idle_time(client, db):
    _login(client, db)
    user = db.query(User).filter(User.email == "sess.user").first()
    stale = create_access_token(user.id, user.role, expires_delta=timedelta(seconds=-5))
    client.cookies.set(settings.COOKIE_NAME, stale)
    assert client.get("/api/auth/me").status_code == 401


def test_active_session_slides_but_has_absolute_limit(client, db):
    r = _login(client, db)
    assert client.get("/api/auth/me").status_code == 200
    assert settings.COOKIE_NAME in client.get("/api/auth/me").headers.get("set-cookie", "")  # idle timer restarted
    user = db.query(User).filter(User.email == "sess.user").first()
    old_login = int(__import__("time").time()) - settings.SESSION_EXPIRE_HOURS * 3600 - 10
    payload = decode_access_token(create_access_token(user.id, user.role, auth_time=old_login, expires_delta=timedelta(minutes=5)))
    assert refresh_access_token(payload) is None  # past the absolute limit: no new token


def test_logout_ends_all_sessions_of_the_user(client, db):
    _login(client, db)
    old = client.cookies.get(settings.COOKIE_NAME)
    assert client.post("/api/auth/logout", headers=H).status_code == 200
    client.cookies.set(settings.COOKIE_NAME, old)  # a copy of the old token (other device / stolen) no longer works
    assert client.get("/api/auth/me").status_code == 401


def test_password_reset_ends_sessions(admin_client, client, db):
    _login(client, db)
    token = client.cookies.get(settings.COOKIE_NAME)
    user = db.query(User).filter(User.email == "sess.user").first()
    assert admin_client.post(f"/api/admin/users/{user.id}/reset-password", headers=H, json={"new_password": "Brand-New-Pass-123"}).status_code == 200
    client.cookies.set(settings.COOKIE_NAME, token)
    assert client.get("/api/auth/me").status_code == 401
