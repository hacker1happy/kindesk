from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class Stage(BaseModel):
    key: str
    label: str
    completed: bool = False
    updated_at: Optional[datetime] = None
    documents: List[dict] = []
    ops_review_form: Optional[dict] = None
    approval_status: Optional[str] = None
    approval_comment: Optional[str] = None

class QueryItem(BaseModel):
    query_no: int
    documents: List[dict] = []
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
    closure_reason: Optional[str] = None
    closure_comment: Optional[dict] = None
