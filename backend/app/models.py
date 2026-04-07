from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Client(BaseModel):
    id: str
    name: str
    phone: str
    assigned_to: str
    assigned_from: str
    created_at: str
    files: Optional[List[str]] = []

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