from fastapi import APIRouter, HTTPException
from datetime import datetime
import uuid
from app.models import CaseCreateRequest
from app.storage import read_data, write_data
from app.utils import generate_case_id

router = APIRouter()

@router.post("/clients/{client_id}/cases")
def add_case(client_id: str, payload: CaseCreateRequest):
    data = read_data()

    client = next((c for c in data if c["id"] == client_id), None)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    case_id = generate_case_id()

    form_link = f"/cases/{payload.case_type}/{case_id}"

    new_case = {
        "case_id": case_id,
        "folio_number": payload.folio_number,
        "company": payload.company,
        "case_type": payload.case_type,
        "status": "initiated",
        "created_at": datetime.utcnow().isoformat(),
        "form_link": form_link,
        "files": []
    }

    if "cases" not in client:
        client["cases"] = []

    client["cases"].append(new_case)

    write_data(data)

    return new_case


@router.get("/clients/{client_id}/cases")
def get_cases(client_id: str):
    data = read_data()

    client = next((c for c in data if c["id"] == client_id), None)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    return client.get("cases", [])