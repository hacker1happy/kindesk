from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.models.document_schema import DocumentRequest

class Case(BaseModel):
    case_id: str
    folio_number: str
    company: str
    case_type: str
    status: str
    created_at: datetime
    form_data: dict = {}
    files: Optional[List[str]] = []


class CaseCreateRequest(BaseModel):
    folio_number: str
    company: str
    case_type: str

class StatusUpdateRequest(BaseModel):
    status: str