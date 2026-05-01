from fastapi import APIRouter, HTTPException
from app.repository.storage import read_cases, read_clients, read_companies, read_rtas, write_cases

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


def enrich_form_data_for_case(case: dict, payload: dict):
    enriched_payload = {
        **payload,
        "otherInfo": {
            **payload.get("otherInfo", {})
        },
        "companyInfo": {
            **payload.get("companyInfo", {})
        },
        "rtaInfo": {
            **payload.get("rtaInfo", {})
        },
    }

    if case.get("folio_number"):
        enriched_payload["otherInfo"]["folioNumber"] = case["folio_number"]

    companies = read_companies()
    rtas = read_rtas()
    company = companies.get(case.get("company_id"), {})

    if company:
        enriched_payload["companyInfo"] = {
            "name": company.get("company_name", enriched_payload["companyInfo"].get("name", "")),
            "address": company.get("company_address", enriched_payload["companyInfo"].get("address", "")),
        }

        rta = rtas.get(company.get("rta_id"), {})
        enriched_payload["rtaInfo"] = {
            "name": rta.get("rta_name", enriched_payload["rtaInfo"].get("name", "")),
            "address": rta.get("rta_address", enriched_payload["rtaInfo"].get("address", "")),
        }

    return enriched_payload


@router.put("/clients/{client_id}/cases/{case_id}/form")
def save_form_data(client_id: str, case_id: str, payload: dict):
    cases, case = get_owned_case(client_id, case_id)

    case["form_data"] = enrich_form_data_for_case(case, payload)

    write_cases(cases)

    return {"message": "form data saved"}


@router.get("/clients/{client_id}/cases/{case_id}/form")
def get_form_data(client_id: str, case_id: str):
    _, case = get_owned_case(client_id, case_id)

    return case.get("form_data", {})
