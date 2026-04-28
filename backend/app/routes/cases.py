from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.models.case_schema import CaseCreateRequest
from app.repository.storage import read_data, write_data
from app.utils.id_generator_utils import generate_case_id
from app.constants.helper_constants import DEFAULT_STAGES

router = APIRouter()

from datetime import datetime

def init_stages():
    return [
        {
            **stage,
            "completed": False,
            "updated_at": None,
            "documents": []
        }
        for stage in DEFAULT_STAGES
    ]
    
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
        "company_id": payload.company_id,
        "case_type": payload.case_type,
        "status": "fresh",
        "created_at": datetime.now().isoformat(),
        "form_data": {},
        "files": [],
        "stages": init_stages(),
        "queries": []
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