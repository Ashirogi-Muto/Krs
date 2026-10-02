"""Server-side password reset for any account of this ledger (the only reset path besides the ADMIN in the app).

    docker exec -it krs-fin-<ledger>-api python -m app.set_password <username>
    (wrapped by `sudo krs-finance-passwd official|unofficial <username>` on the KRS server)

The new password is prompted for twice and never echoed. The reset is written to the audit trail as SERVER CLI.
"""
import getpass
import sys

from app.database import SessionLocal
from app.models.user import User
from app.services.audit_service import record_audit
from app.services.auth_service import hash_password

MIN_PASSWORD_LENGTH = 12


def set_password(username: str, password: str, db=None) -> User:
    own_session = db is None
    db = db or SessionLocal()
    try:
        user = db.query(User).filter(User.email == username.strip().lower()).first()
        if not user:
            raise LookupError(f"No account named '{username}'")
        if len(password) < MIN_PASSWORD_LENGTH:
            raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters")
        user.password_hash = hash_password(password)
        record_audit(db, None, "SERVER CLI", "PASSWORD_RESET", "USER", user.id, None, {"email": user.email, "reset_by": "server CLI"})
        db.commit()
        return user
    finally:
        if own_session:
            db.close()


def main() -> None:
    if len(sys.argv) != 2:
        print("usage: python -m app.set_password <username>", file=sys.stderr)
        sys.exit(2)
    password = getpass.getpass("New password (12+ characters): ")
    if password != getpass.getpass("Repeat new password: "):
        print("[!] Passwords do not match; nothing changed.", file=sys.stderr)
        sys.exit(1)
    try:
        user = set_password(sys.argv[1], password)
    except (LookupError, ValueError) as e:
        print(f"[!] {e}; nothing changed.", file=sys.stderr)
        sys.exit(1)
    print(f"[ok] Password changed for '{user.email}' ({user.role}).")


if __name__ == "__main__":
    main()
