from pydantic import BaseModel
from typing import List, Optional


class Client(BaseModel):
    name: str
    phone: str
    assigned_to: str
    assigned_from: str
    created_at: str
    files_info: dict = {}
    case_ids: Optional[List[str]] = []
