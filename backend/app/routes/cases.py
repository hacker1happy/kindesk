from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.models.case_schema import CaseCreateRequest
from app.repository.storage import read_cases, read_clients, read_companies, read_rtas, write_cases, write_clients
from app.utils.id_generator_utils import generate_case_id
from app.constants.helper_constants import DEFAULT_STAGES

router = APIRouter()

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


def with_company_info(case):
    companies = read_companies()
    rtas = read_rtas()
    company = companies.get(case.get("company_id"), {})
    rta = rtas.get(company.get("rta_id"), {})

    return {
        **case,
        "company": company.get("company_name", case.get("company_id", "")),
        "company_name": company.get("company_name", ""),
        "company_address": company.get("company_address", ""),
        "rta_id": company.get("rta_id", ""),
        "rta_name": rta.get("rta_name", ""),
        "rta_address": rta.get("rta_address", "")
    }
    
@router.post("/clients/{client_id}/cases")
def add_case(client_id: str, payload: CaseCreateRequest):
    clients = read_clients()
    cases = read_cases()

    client = clients.get(client_id)
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

    case_ids = client.setdefault("case_ids", [])
    case_ids.append(case_id)
    cases[case_id] = new_case

    write_cases(cases)
    write_clients(clients)

    return new_case


@router.get("/cases")
def get_all_cases():
    cases = read_cases()
    return [with_company_info(case) for case in cases.values()]


@router.get("/clients/{client_id}/cases")
def get_cases(client_id: str):
    clients = read_clients()
    cases = read_cases()

    client = clients.get(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    return [
        with_company_info(cases[case_id])
        for case_id in client.get("case_ids", [])
        if case_id in cases
    ]


@router.get("/clients/{client_id}/cases/{case_id}")
def get_case(client_id: str, case_id: str):
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

    return {
        "case": with_company_info(case),
        "client": {
            "id": client_id,
            **client
        }
    }
