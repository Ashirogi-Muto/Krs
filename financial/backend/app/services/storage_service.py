"""Pluggable file storage engine (Local Vault & S3) with magic byte validation."""
import io
import os
import uuid
import hashlib
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Tuple, Optional
from app.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}

def detect_mime_from_magic_bytes(data: bytes) -> Optional[str]:
    """Inspect magic bytes to determine file MIME type securely."""
    if len(data) < 12:
        return None
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"%PDF-"):
        return "application/pdf"
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return "image/webp"
    return None

class StorageProvider(ABC):
    @abstractmethod
    def save_file(self, file_bytes: bytes, original_filename: str) -> Tuple[str, str, int, str]:
        """Save file bytes and return (storage_key, mime_type, file_size, sha256_checksum)."""
        pass

    @abstractmethod
    def get_file_stream(self, storage_key: str) -> io.BytesIO:
        """Return BytesIO stream for the given storage key."""
        pass

    @abstractmethod
    def delete_file(self, storage_key: str) -> None:
        """Delete file from storage."""
        pass

class LocalStorageProvider(StorageProvider):
    def __init__(self, vault_dir: str):
        self.vault_path = Path(vault_dir).resolve()
        self.vault_path.mkdir(parents=True, exist_ok=True)

    def save_file(self, file_bytes: bytes, original_filename: str) -> Tuple[str, str, int, str]:
        file_size = len(file_bytes)
        if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
            raise ValueError(f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB")

        ext = Path(original_filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Disallowed extension: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

        detected_mime = detect_mime_from_magic_bytes(file_bytes)
        if not detected_mime:
            raise ValueError("Invalid file content: signature does not match allowed types (.jpg, .png, .webp, .pdf)")

        # Verify extension aligns with content
        if detected_mime == "image/jpeg" and ext not in (".jpg", ".jpeg"):
            ext = ".jpg"
        elif detected_mime == "image/png" and ext != ".png":
            ext = ".png"
        elif detected_mime == "image/webp" and ext != ".webp":
            ext = ".webp"
        elif detected_mime == "application/pdf" and ext != ".pdf":
            ext = ".pdf"

        storage_key = f"{uuid.uuid4().hex}{ext}"
        target_path = (self.vault_path / storage_key).resolve()

        if not target_path.is_relative_to(self.vault_path):
            raise ValueError("Path traversal attack detected")

        with open(target_path, "wb") as f:
            f.write(file_bytes)

        checksum = hashlib.sha256(file_bytes).hexdigest()
        return storage_key, detected_mime, file_size, checksum

    def get_file_stream(self, storage_key: str) -> io.BytesIO:
        target_path = (self.vault_path / storage_key).resolve()
        if not target_path.is_relative_to(self.vault_path) or not target_path.exists():
            raise FileNotFoundError("Requested file does not exist")
        with open(target_path, "rb") as f:
            return io.BytesIO(f.read())

    def delete_file(self, storage_key: str) -> None:
        target_path = (self.vault_path / storage_key).resolve()
        if target_path.is_relative_to(self.vault_path) and target_path.exists():
            target_path.unlink()

class S3StorageProvider(StorageProvider):
    def __init__(self):
        import boto3
        from botocore.config import Config
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=settings.STORAGE_ENDPOINT,
            aws_access_key_id=settings.STORAGE_ACCESS_KEY,
            aws_secret_access_key=settings.STORAGE_SECRET_KEY,
            region_name=settings.STORAGE_REGION,
            config=Config(signature_version="s3v4")
        )
        self.bucket = settings.STORAGE_BUCKET

    def save_file(self, file_bytes: bytes, original_filename: str) -> Tuple[str, str, int, str]:
        file_size = len(file_bytes)
        if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
            raise ValueError(f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB")

        ext = Path(original_filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Disallowed extension: {ext}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

        detected_mime = detect_mime_from_magic_bytes(file_bytes)
        if not detected_mime:
            raise ValueError("Invalid file content: signature does not match allowed types (.jpg, .png, .webp, .pdf)")

        storage_key = f"receipts/{uuid.uuid4().hex}{ext}"
        self.s3_client.put_object(
            Bucket=self.bucket,
            Key=storage_key,
            Body=file_bytes,
            ContentType=detected_mime
        )
        checksum = hashlib.sha256(file_bytes).hexdigest()
        return storage_key, detected_mime, file_size, checksum

    def get_file_stream(self, storage_key: str) -> io.BytesIO:
        response = self.s3_client.get_object(Bucket=self.bucket, Key=storage_key)
        return io.BytesIO(response["Body"].read())

    def delete_file(self, storage_key: str) -> None:
        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=storage_key)
        except Exception:
            pass

_storage_provider: Optional[StorageProvider] = None

def get_storage_provider() -> StorageProvider:
    global _storage_provider
    if _storage_provider is None:
        if settings.STORAGE_TYPE == "s3":
            _storage_provider = S3StorageProvider()
        else:
            _storage_provider = LocalStorageProvider(settings.LOCAL_VAULT_DIR)
    return _storage_provider
