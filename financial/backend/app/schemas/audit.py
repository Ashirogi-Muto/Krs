"""Audit log schemas."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: str
    action: str
    entity_type: str
    entity_id: str
    before_data: Optional[Any] = None
    after_data: Optional[Any] = None
    created_at: datetime

    model_config = {"from_attributes": True}
