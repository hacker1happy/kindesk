from pydantic import BaseModel
from typing import List, Optional


class Client(BaseModel):
    name: str
    phone: str
    assigned_to: str
    assigned_from: str = ""
    field_staff: str = ""
    partner_name: str = ""
    partner_company_name: str = ""
    partner_location: str = ""
    partner_phone: str = ""
    comment: str = ""
    created_at: str
    files_info: dict = {}
    case_ids: Optional[List[str]] = []
