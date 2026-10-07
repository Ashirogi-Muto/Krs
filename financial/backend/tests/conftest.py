"""Test configuration and fixtures."""
import os
import tempfile
import pytest
from datetime import date
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["ENVIRONMENT"] = "testing"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SESSION_SECRET"] = "testing-secret-key-at-least-32-characters-long!"
# Uploaded test files go to a temporary folder, not the tracked backend/vault directory
os.environ["LOCAL_VAULT_DIR"] = tempfile.mkdtemp(prefix="krs-vault-test-")

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.category import Category
from app.models.payment_method import PaymentMethod
from app.models.income import Income
from app.models.expense import Expense
from app.services.auth_service import hash_password, create_access_token
from app.config import settings

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Seed base categories and payment methods
    cat_inc = Category(name="Sponsorship", type="INCOME", is_active=True)
    cat_exp = Category(name="Equipment", type="EXPENSE", is_active=True)
    pm = PaymentMethod(name="UPI", is_active=True)
    session.add_all([cat_inc, cat_exp, pm])

    # Seed users
    admin_user = User(
        name="Test Admin",
        email="admin@test.local",
        password_hash=hash_password("Test-Admin-Pass-12345"),
        role="ADMIN",
        is_active=True
    )
    editor_user = User(
        name="Test Editor",
        email="test_editor@krs.club",
        password_hash=hash_password("EditorPass123!"),
        role="EDITOR",
        is_active=True
    )
    viewer_user = User(
        name="Test Viewer",
        email="test_viewer@krs.club",
        password_hash=hash_password("ViewerPass123!"),
        role="VIEWER",
        is_active=True
    )
    session.add_all([admin_user, editor_user, viewer_user])
    session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()

def _create_client_with_user(db_session, user_email: str = None):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    if user_email:
        user = db_session.query(User).filter(User.email == user_email).first()
        if user:
            token = create_access_token(user_id=user.id, role=user.role)
            client.cookies.set(settings.COOKIE_NAME, token)
            client.headers.update({"X-Requested-With": "XMLHttpRequest"})
    return client

@pytest.fixture
def client(db):
    c = _create_client_with_user(db, None)
    yield c
    app.dependency_overrides.clear()

@pytest.fixture
def editor_client(db):
    c = _create_client_with_user(db, "test_editor@krs.club")
    yield c
    app.dependency_overrides.clear()

@pytest.fixture
def viewer_client(db):
    c = _create_client_with_user(db, "test_viewer@krs.club")
    yield c
    app.dependency_overrides.clear()

@pytest.fixture
def admin_client(db):
    c = _create_client_with_user(db, "admin@test.local")
    yield c
    app.dependency_overrides.clear()
