from fastapi import APIRouter, HTTPException
from app.repository.storage import read_data, write_data

router = APIRouter()

@router.put("/clients/{client_id}/cases/{case_id}/form")
def save_form_data(client_id: str, case_id: str, payload: dict):
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

    case["form_data"] = payload

    write_data(data)

    return {"message": "form data saved"}

@router.get("/clients/{client_id}/cases/{case_id}/form")
def get_form_data(client_id: str, case_id: str):
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

    return case.get("form_data", {})