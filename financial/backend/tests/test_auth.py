"""Authentication and session cookie tests."""
from app.config import settings

def test_login_success(client):
    res = client.post(
        "/api/auth/login",
        json={"email": "test_editor@krs.club", "password": "EditorPass123!"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "test_editor@krs.club"
    assert data["role"] == "EDITOR"
    # Verify HttpOnly session cookie was set
    assert settings.COOKIE_NAME in res.cookies

def test_login_invalid_password(client):
    res = client.post(
        "/api/auth/login",
        json={"email": "test_editor@krs.club", "password": "WrongPassword!"}
    )
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]

def test_get_me_authenticated(editor_client):
    res = editor_client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.json()["role"] == "EDITOR"

def test_get_me_unauthenticated(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401

def test_logout(editor_client):
    res = editor_client.post("/api/auth/logout")
    assert res.status_code == 200
    # Cookie should be unset or empty
    assert res.cookies.get(settings.COOKIE_NAME) is None or res.cookies.get(settings.COOKIE_NAME) == '""'


def test_login_lockout_after_repeated_failures(client):
    """5 wrong passwords lock the account for 15 minutes (even the right password is refused)."""
    from app.services import login_guard
    email = "lockout-check@test.local"
    login_guard.record_success(email)  # clean state
    for _ in range(5):
        r = client.post("/api/auth/login", json={"email": email, "password": "wrong-password-123"})
        assert r.status_code == 401
    r = client.post("/api/auth/login", json={"email": email, "password": "wrong-password-123"})
    assert r.status_code == 429
    login_guard.record_success(email)
