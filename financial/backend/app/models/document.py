"""Document and document linking models."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    storage_key = Column(String(500), unique=True, nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    checksum_sha256 = Column(String(64), nullable=False)
    document_type = Column(String(30), default="OTHER", index=True, nullable=False)  # "INVOICE", "RECEIPT", "PAYMENT_PROOF", "QUOTE", "CONTRACT", "OTHER"
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    uploader = relationship("User")
    links = relationship("DocumentLink", back_populates="document", cascade="all, delete-orphan")

class DocumentLink(Base):
    __tablename__ = "document_links"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    entity_type = Column(String(20), nullable=False)  # "INCOME" or "EXPENSE"
    entity_id = Column(String(36), index=True, nullable=False)

    document = relationship("Document", back_populates="links")

    __table_args__ = (
        UniqueConstraint("document_id", "entity_type", "entity_id", name="uq_doc_entity_link"),
    )
