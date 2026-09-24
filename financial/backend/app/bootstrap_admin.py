"""Standalone administrative user bootstrap CLI."""
import sys
from app.database import SessionLocal
from app.models.user import User
from app.services.auth_service import hash_password

def bootstrap_admin(
    email: str = "tanishaqbansal@gmail.com",
    password: str = "TanishaqLovesAanya",
    name: str = "Tanishaq Bansal"
):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.strip().lower()).first()
        if user:
            user.role = "ADMIN"
            user.is_active = True
            user.password_hash = hash_password(password)
            user.name = name
            print(f"[✓] Updated existing user '{email}' to ADMIN role with provided password.")
        else:
            user = User(
                name=name,
                email=email.strip().lower(),
                password_hash=hash_password(password),
                role="ADMIN",
                is_active=True
            )
            db.add(user)
            print(f"[✓] Created new administrator '{email}' with role ADMIN.")
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[!] Error bootstrapping admin: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    bootstrap_admin()
