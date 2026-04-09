from fastapi import APIRouter, HTTPException
from app.models.case_schema import StatusUpdateRequest
from app.repository.storage import read_data, write_data

router = APIRouter()

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