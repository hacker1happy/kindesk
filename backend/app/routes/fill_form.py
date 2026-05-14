from copy import deepcopy

from fastapi import APIRouter, HTTPException, Query
from app.repository.storage import read_cases, read_clients, read_companies, read_rtas, write_cases

router = APIRouter()

TRANSMISSION_LIKE_CASE_TYPES = {"transmission", "joint"}


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


def case_types_are_copy_compatible(source_type: str, target_type: str):
    source_type = (source_type or "").lower()
    target_type = (target_type or "").lower()

    if source_type == "duplicate" or target_type == "duplicate":
        return source_type == target_type

    return source_type in TRANSMISSION_LIKE_CASE_TYPES and target_type in TRANSMISSION_LIKE_CASE_TYPES


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


@router.get("/cases/{source_case_id}/form-copy")
def get_copyable_form_data(
    source_case_id: str,
    target_case_id: str = Query(..., min_length=1),
):
    cases = read_cases()
    source_case = cases.get(source_case_id)
    target_case = cases.get(target_case_id)

    if not source_case:
        raise HTTPException(status_code=404, detail="Source case not found")

    if not target_case:
        raise HTTPException(status_code=404, detail="Current case not found")

    if source_case_id == target_case_id:
        raise HTTPException(status_code=400, detail="Choose a different source case")

    if not case_types_are_copy_compatible(source_case.get("case_type"), target_case.get("case_type")):
        raise HTTPException(
            status_code=400,
            detail="This case type cannot be copied into the current form",
        )

    form_data = deepcopy(source_case.get("form_data") or {})
    if not form_data:
        raise HTTPException(status_code=404, detail="Source case has no form data")

    form_data.pop("documents", None)

    return {
        "source_case_id": source_case_id,
        "source_case_type": source_case.get("case_type"),
        "form_data": form_data,
    }
