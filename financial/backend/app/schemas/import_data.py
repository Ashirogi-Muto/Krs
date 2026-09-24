"""Data import schemas for XLSX/CSV ingestion."""
from typing import List, Optional, Any, Dict, Literal
from pydantic import BaseModel

class ImportRowError(BaseModel):
    row_number: int
    field: Optional[str] = None
    error_type: str  # "ERROR" or "WARNING"
    message: str

class ImportPreviewResponse(BaseModel):
    import_key: str
    filename: str
    total_rows: int
    valid_rows: int
    warning_count: int
    error_count: int
    duplicate_count: int
    errors: List[ImportRowError] = []
    preview_rows: List[Dict[str, Any]] = []

class ImportConfirmRequest(BaseModel):
    import_key: str
    duplicate_action: Literal["SKIP", "UPDATE"] = "SKIP"

class ImportResultResponse(BaseModel):
    total_processed: int
    created_count: int
    updated_count: int
    skipped_count: int
    message: str
