from fastapi import APIRouter, HTTPException
from app.repository.storage import read_cases, read_clients, write_cases

router = APIRouter()


def get_owned_case(client_id: str, case_id: str):
    clients = read_clients()
    cases = read_cases()

    client = clients.get(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if case_id not in client.get("case_ids", []):
        raise HTTPException(status_code=404, detail="Case not found")

    case = cases.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return cases, case


@router.put("/clients/{client_id}/cases/{case_id}/form")
def save_form_data(client_id: str, case_id: str, payload: dict):
    cases, case = get_owned_case(client_id, case_id)

    case["form_data"] = payload

    write_cases(cases)

    return {"message": "form data saved"}


@router.get("/clients/{client_id}/cases/{case_id}/form")
def get_form_data(client_id: str, case_id: str):
    _, case = get_owned_case(client_id, case_id)

    return case.get("form_data", {})
