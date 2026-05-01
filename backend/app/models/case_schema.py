from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class Stage(BaseModel):
    key: str
    label: str
    completed: bool = False
    updated_at: Optional[datetime] = None
    documents: List[str] = []

class QueryItem(BaseModel):
    query_no: int
    documents: List[str] = []
    updated_at: Optional[datetime] = None

class CaseCreateRequest(BaseModel):
    folio_number: str
    company_id: str
    case_type: str

class Case(BaseModel):
    case_id: str
    folio_number: str
    company_id: str
    case_type: str
    status: str
    created_at: datetime
    form_data: dict = {}
    files: Optional[List[str]] = []
    stages: Optional[List[Stage]] = []
    queries: Optional[List[QueryItem]] = []
