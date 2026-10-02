"""Standalone administrative user bootstrap CLI.

Creates (or promotes) an ADMIN account. Credentials are never stored in code:
    BOOTSTRAP_ADMIN_EMAIL=... BOOTSTRAP_ADMIN_NAME=... BOOTSTRAP_ADMIN_PASSWORD=... python -m app.bootstrap_admin
If BOOTSTRAP_ADMIN_PASSWORD is not set, the password is prompted for (not echoed).
An existing user's password is only changed when BOOTSTRAP_RESET_PASSWORD=1.
"""
import getpass
import os
import sys

from app.database import SessionLocal
from app.models.user import User
from app.services.auth_service import hash_password

MIN_PASSWORD_LENGTH = 12


def bootstrap_admin() -> None:
    email = (os.environ.get("BOOTSTRAP_ADMIN_EMAIL") or "").strip().lower()
    name = (os.environ.get("BOOTSTRAP_ADMIN_NAME") or "KRS Finance Administrator").strip()
    if not email:
        print("[!] Set BOOTSTRAP_ADMIN_EMAIL to the administrator's email address.", file=sys.stderr)
        sys.exit(2)

    password = os.environ.get("BOOTSTRAP_ADMIN_PASSWORD") or getpass.getpass("New administrator password: ")
    if len(password) < MIN_PASSWORD_LENGTH:
        print(f"[!] Password must be at least {MIN_PASSWORD_LENGTH} characters.", file=sys.stderr)
        sys.exit(2)

    reset_existing = os.environ.get("BOOTSTRAP_RESET_PASSWORD") == "1"
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.role = "ADMIN"
            user.is_active = True
            if reset_existing:
                user.password_hash = hash_password(password)
            print(f"[✓] Existing user '{email}' set to ADMIN" + (" and password reset." if reset_existing else "."))
        else:
            db.add(User(name=name, email=email, password_hash=hash_password(password), role="ADMIN", is_active=True))
            print(f"[✓] Created administrator '{email}'.")
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[!] Error bootstrapping admin: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    bootstrap_admin()
