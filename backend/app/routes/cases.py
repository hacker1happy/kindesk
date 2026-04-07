from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.models import CaseCreateRequest, StatusUpdateRequest
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


    new_case = {
        "case_id": case_id,
        "folio_number": payload.folio_number,
        "company": payload.company,
        "case_type": payload.case_type,
        "status": "fresh",
        "created_at": datetime.now().isoformat(),
        "form_data": {},
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


@router.get("/clients/{client_id}/cases/{case_id}")
def get_case(client_id: str, case_id: str):
    data = read_data()

    client = next((c for c in data if c["id"] == client_id), None)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    case = next(
        (c for c in client.get("cases", []) if c["case_id"] == case_id),
        None
    )

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return {
        "case": case,
        "client": client
    }

@router.put("/clients/{client_id}/cases/{case_id}/status")
def update_status(client_id: str, case_id: str, payload: StatusUpdateRequest):
    data = read_data()

    client = next((c for c in data if c["id"] == client_id), None)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    case = next(
        (c for c in client.get("cases", []) if c["case_id"] == case_id),
        None
    )

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case["status"] = payload.status

    write_data(data)

    return {"message": "status updated"}