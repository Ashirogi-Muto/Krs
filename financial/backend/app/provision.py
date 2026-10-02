"""Provision the fixed accounts of this ledger from environment variables at startup.

Accounts (username + password from the instance's .env, edited by the owner):
  ACCOUNT_ADMIN_*      -> ADMIN  (financial audit department; the only role that sees users and the audit trail)
  ACCOUNT_TREASURER_*  -> EDITOR (treasurer; can also create VIEWER accounts)
  ACCOUNT_PRESIDENT_*  -> VIEWER (president)
Each account needs <PREFIX>_USERNAME and <PREFIX>_PASSWORD (12+ characters); <PREFIX>_NAME is optional.
An account with an empty password is skipped. When the .env password changes, the stored hash is updated.
Every creation / change is written to the audit trail as SYSTEM (never the password itself).
"""
import logging
import os

from app.database import SessionLocal
from app.models.audit_log import AuditLog
from app.models.user import User
from app.services.auth_service import hash_password, verify_password

logger = logging.getLogger("krs_financial")
MIN_PASSWORD_LENGTH = 12
ACCOUNTS = [
    ("ACCOUNT_ADMIN", "ADMIN", "Financial Audit"),
    ("ACCOUNT_TREASURER", "EDITOR", "Treasurer"),
    ("ACCOUNT_PRESIDENT", "VIEWER", "President"),
]


def _audit(db, action: str, user: User, details: dict) -> None:
    db.add(AuditLog(user_id=None, user_name="SYSTEM", action=action, entity_type="USER",
                    entity_id=user.id, before_data=None, after_data=details))


def provision_accounts(db=None) -> None:
    own_session = db is None
    db = db or SessionLocal()
    try:
        for prefix, role, default_name in ACCOUNTS:
            username = (os.environ.get(f"{prefix}_USERNAME") or "").strip().lower()
            password = os.environ.get(f"{prefix}_PASSWORD") or ""
            name = (os.environ.get(f"{prefix}_NAME") or default_name).strip()
            if not username or not password:
                logger.info(f'"{prefix}: username or password not set; account not provisioned"')
                continue
            if len(password) < MIN_PASSWORD_LENGTH:
                logger.warning(f'"{prefix}: password shorter than {MIN_PASSWORD_LENGTH} characters; skipped"')
                continue
            user = db.query(User).filter(User.email == username).first()
            if not user:
                user = User(name=name, email=username, password_hash=hash_password(password), role=role, is_active=True)
                db.add(user)
                db.flush()
                _audit(db, "ACCOUNT_PROVISIONED", user, {"username": username, "role": role, "source": "env"})
                continue
            changes = {}
            if user.role != role:
                changes["role"] = [user.role, role]
                user.role = role
            if not user.is_active:
                changes["is_active"] = [False, True]
                user.is_active = True
            if user.name != name:
                user.name = name
            if not verify_password(password, user.password_hash):
                user.password_hash = hash_password(password)
                changes["password"] = "changed from env"
            if changes:
                _audit(db, "ACCOUNT_UPDATED_FROM_ENV", user, {"username": username, **{k: str(v) for k, v in changes.items()}})
        db.commit()
    except Exception as e:  # never block startup on provisioning, but make it visible
        db.rollback()
        logger.error(f'"Account provisioning failed: {e}"')
    finally:
        if own_session:
            db.close()
