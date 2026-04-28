import json
from fastapi import APIRouter, Query, HTTPException

router = APIRouter()

# 🔹 Load data (both are now dicts)
with open("data/companies_master.json") as f:
    companies = json.load(f)

with open("data/rta_master.json") as f:
    rtas = json.load(f)


# ----------------------------------------
# ✅ GET /companies (search)
# ----------------------------------------
@router.get("/companies")
def get_companies(search: str = Query(default=""), limit: int = 50):
    search = search.strip().lower()
    results = []

    for company_id, c in companies.items():
        company_name = (c.get("company_name") or "").lower()

        if not search or search in company_name:
            rta = rtas.get(c.get("rta_id"), {})

            results.append({
                "company_id": company_id,
                "company_name": c.get("company_name"),
                "company_address": c.get("company_address"),
                "rta_name": rta.get("rta_name"),
                "rta_address": rta.get("rta_address")
            })
    return results[:limit]


# ----------------------------------------
# ✅ GET /companies/{company_id}
# ----------------------------------------
@router.get("/companies/{company_id}")
def get_company(company_id: str):
    c = companies.get(company_id)

    if not c:
        raise HTTPException(status_code=404, detail="Company not found")

    rta = rtas.get(c["rta_id"], {})

    return {
        "company_id": company_id,
        "company_name": c["company_name"],
        "company_address": c["company_address"],
        "rta_id": c["rta_id"],
        "rta_name": rta.get("rta_name"),
        "rta_address": rta.get("rta_address")
    }


# ----------------------------------------
# ✅ GET /companies/by-name/{company_name}
# ----------------------------------------
@router.get("/companies/by-name/{company_name}")
def get_company_by_name(company_name: str):
    company_name = company_name.strip().lower()

    for company_id, c in companies.items():
        if c["company_name"].lower() == company_name:
            rta = rtas.get(c["rta_id"], {})

            return {
                "company_id": company_id,
                "company_name": c["company_name"],
                "company_address": c["company_address"],
                "rta_id": c["rta_id"],
                "rta_name": rta.get("rta_name"),
                "rta_address": rta.get("rta_address")
            }

    raise HTTPException(status_code=404, detail="Company not found")


# ----------------------------------------
# ✅ GET /rtas
# ----------------------------------------
@router.get("/rtas")
def get_all_rtas():
    return rtas


# ----------------------------------------
# ✅ GET /rtas/{rta_id}
# ----------------------------------------
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
    c = companies.get(company_id)

    if not c:
        raise HTTPException(status_code=404, detail="Company not found")

    rta = rtas.get(c["rta_id"])

    if not rta:
        raise HTTPException(status_code=500, detail="Invalid RTA mapping")

    return {
        "company_id": company_id,
        "rta_id": c["rta_id"],
        "rta_name": rta["rta_name"],
        "rta_address": rta["rta_address"]
    }