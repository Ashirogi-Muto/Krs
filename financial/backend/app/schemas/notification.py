"""Notification schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class NotificationListResponse(BaseModel):
    unread_count: int
    items: List[NotificationResponse] = []
