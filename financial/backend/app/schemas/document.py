"""Document schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class DocumentResponse(BaseModel):
    id: str
    filename: str
    mime_type: str
    file_size: int
    checksum_sha256: str
    document_type: str = "OTHER"
    uploaded_by: str
    uploader_name: Optional[str] = None
    uploaded_at: datetime
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    transaction_id: Optional[str] = None
    project_name: Optional[str] = None

    model_config = {"from_attributes": True}
