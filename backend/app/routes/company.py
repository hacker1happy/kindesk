from fastapi import APIRouter, Query, HTTPException

from app.repository.storage import read_companies, read_rtas

router = APIRouter()

companies = read_companies()
rtas = read_rtas()


@router.get("/companies")
def get_companies(search: str = Query(default=""), limit: int = 50):
    search = search.strip().lower()
    results = []

    for company_id, company in companies.items():
        company_name = (company.get("company_name") or "").lower()

        if not search or search in company_name or search in company_id.lower():
            rta = rtas.get(company.get("rta_id"), {})

            results.append({
                "company_id": company_id,
                "company_name": company.get("company_name"),
                "company_address": company.get("company_address"),
                "rta_id": company.get("rta_id"),
                "rta_name": rta.get("rta_name"),
                "rta_address": rta.get("rta_address")
            })
    return results[:limit]


@router.get("/companies/{company_id}")
def get_company(company_id: str):
    company = companies.get(company_id)

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    rta = rtas.get(company["rta_id"], {})

    return {
        "company_id": company_id,
        "company_name": company["company_name"],
        "company_address": company["company_address"],
        "rta_id": company["rta_id"],
        "rta_name": rta.get("rta_name"),
        "rta_address": rta.get("rta_address")
    }


@router.get("/companies/by-name/{company_name}")
def get_company_by_name(company_name: str):
    company_name = company_name.strip().lower()

    for company_id, company in companies.items():
        if company["company_name"].lower() == company_name:
            rta = rtas.get(company["rta_id"], {})

            return {
                "company_id": company_id,
                "company_name": company["company_name"],
                "company_address": company["company_address"],
                "rta_id": company["rta_id"],
                "rta_name": rta.get("rta_name"),
                "rta_address": rta.get("rta_address")
            }

    raise HTTPException(status_code=404, detail="Company not found")


@router.get("/rtas")
def get_all_rtas():
    return rtas


@router.get("/rtas/{rta_id}")
def get_rta(rta_id: str):
    rta = rtas.get(rta_id)

    if not rta:
        raise HTTPException(status_code=404, detail="RTA not found")

    return {
        "rta_id": rta_id,
        "rta_name": rta.get("rta_name"),
        "rta_address": rta.get("rta_address")
    }


@router.get("/companies/{company_id}/rta")
def get_company_rta(company_id: str):
    company = companies.get(company_id)

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    rta = rtas.get(company["rta_id"])

    if not rta:
        raise HTTPException(status_code=500, detail="Invalid RTA mapping")

    return {
        "company_id": company_id,
        "rta_id": company["rta_id"],
        "rta_name": rta["rta_name"],
        "rta_address": rta["rta_address"]
    }
