"""Application configuration and environment validation."""
import os
import sys
from pathlib import Path
from typing import Literal, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    ENVIRONMENT: Literal["development", "testing", "production"] = "development"
    HOST: str = "127.0.0.1"
    PORT: int = 8050
    
    # Database Configuration
    DATABASE_URL: str = Field(default=f"sqlite:///{BASE_DIR}/krs_financial.db")
    
    # Authentication & Session
    SESSION_SECRET: str = Field(default="dev-insecure-secret-key-32-chars-long-minimum-needed!")
    SESSION_EXPIRE_HOURS: int = 12
    COOKIE_NAME: str = "krs_session"
    COOKIE_SECURE: Optional[bool] = None  # Auto-inferred based on ENVIRONMENT if None
    COOKIE_SAMESITE: Literal["lax", "none", "strict"] = "lax"
    
    # CORS
    FRONTEND_URL: str = "http://localhost:3050"
    
    # Storage Configuration
    STORAGE_TYPE: Literal["local", "s3"] = "local"
    LOCAL_VAULT_DIR: str = str(BASE_DIR / "vault")
    STORAGE_ENDPOINT: Optional[str] = None
    STORAGE_BUCKET: Optional[str] = None
    STORAGE_ACCESS_KEY: Optional[str] = None
    STORAGE_SECRET_KEY: Optional[str] = None
    STORAGE_REGION: str = "us-east-1"
    
    # Security & Uploads
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    MAX_REPORT_RANGE_MONTHS: int = 12
    
    # Logging
    LOG_DIR: str = str(BASE_DIR.parent / "logs")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("DATABASE_URL")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        # Handle Render/Heroku postgres:// -> postgresql:// URL schema
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    def validate_production(self) -> None:
        """Enforce strict fail-fast validation for production environments."""
        if self.ENVIRONMENT == "production":
            errors = []
            if not self.DATABASE_URL or self.DATABASE_URL.startswith("sqlite"):
                errors.append("Production requires a valid PostgreSQL DATABASE_URL. SQLite is prohibited in production.")
            if not self.SESSION_SECRET or len(self.SESSION_SECRET) < 32 or "dev-insecure" in self.SESSION_SECRET:
                errors.append("Production requires a strong SESSION_SECRET with at least 32 characters.")
            if self.STORAGE_TYPE == "s3":
                if not all([self.STORAGE_ENDPOINT, self.STORAGE_BUCKET, self.STORAGE_ACCESS_KEY, self.STORAGE_SECRET_KEY]):
                    errors.append("Production S3 storage requires STORAGE_ENDPOINT, STORAGE_BUCKET, STORAGE_ACCESS_KEY, and STORAGE_SECRET_KEY.")
            else:
                errors.append("Production requires STORAGE_TYPE='s3'. Local storage is prohibited in production.")
            
            if errors:
                print("FATAL CONFIGURATION ERROR (Fail-Fast):", file=sys.stderr)
                for err in errors:
                    print(f"  - {err}", file=sys.stderr)
                raise RuntimeError(f"Production configuration validation failed: {'; '.join(errors)}")

    @property
    def is_cookie_secure(self) -> bool:
        if self.COOKIE_SECURE is not None:
            return self.COOKIE_SECURE
        return self.ENVIRONMENT == "production"

settings = Settings()
# In production, enforce fail-fast on import/startup
if settings.ENVIRONMENT == "production":
    settings.validate_production()
