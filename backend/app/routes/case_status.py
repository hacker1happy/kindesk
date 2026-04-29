import uuid
from typing import List
from datetime import datetime
from fastapi import UploadFile, File, APIRouter, HTTPException

from app.repository.storage import read_cases, read_clients, write_cases
from app.utils.document_utils import get_case_dir

router = APIRouter()


def get_owned_case(client_id: str, case_id: str):
    clients = read_clients()
    cases = read_cases()

    client = clients.get(client_id)
    if not client:
        raise HTTPException(404, "Client not found")

    if case_id not in client.get("case_ids", []):
        raise HTTPException(404, "Case not found")

    case = cases.get(case_id)
    if not case:
        raise HTTPException(404, "Case not found")

    return cases, case


@router.put("/clients/{client_id}/cases/{case_id}/stages/{stage_key}")
def update_stage(client_id: str, case_id: str, stage_key: str):
    cases, case = get_owned_case(client_id, case_id)

    stage = next((s for s in case["stages"] if s["key"] == stage_key), None)
    if not stage:
        raise HTTPException(404, "Stage not found")

    stage["completed"] = True
    stage["updated_at"] = datetime.now().isoformat()
    case["status"] = stage_key

    write_cases(cases)

    return {"message": "stage updated"}


@router.post("/clients/{client_id}/cases/{case_id}/stages/{stage_key}/upload")
async def upload_stage_documents(
    client_id: str,
    case_id: str,
    stage_key: str,
    files: List[UploadFile] = File(...)
):
    cases, case = get_owned_case(client_id, case_id)

    stage = next((s for s in case["stages"] if s["key"] == stage_key), None)
    if not stage:
        raise HTTPException(404, "Stage not found")

    stage_dir = get_case_dir(client_id, case_id) / stage_key
    stage_dir.mkdir(parents=True, exist_ok=True)

    uploaded_files = []

    for file in files:
        unique_name = f"{uuid.uuid4()}_{file.filename}"
        file_path = stage_dir / unique_name

        content = await file.read()

        with open(file_path, "wb") as buffer:
            buffer.write(content)

        file_info = {
            "name": file.filename,
            "url": f"/backend/data/uploads/{client_id}/{case_id}/{stage_key}/{unique_name}",
            "uploaded_at": datetime.now().isoformat()
        }

        uploaded_files.append(file_info)
        stage.setdefault("documents", []).append(file_info)

    stage["updated_at"] = datetime.now().isoformat()

    write_cases(cases)

    return {
        "message": "files uploaded",
        "files": uploaded_files
    }


@router.post("/clients/{client_id}/cases/{case_id}/queries")
def add_query(client_id: str, case_id: str):
    cases, case = get_owned_case(client_id, case_id)

    query_no = len(case.get("queries", [])) + 1

    new_query = {
        "query_no": query_no,
        "documents": [],
        "updated_at": None
    }

    case.setdefault("queries", []).append(new_query)

    write_cases(cases)

    return {"message": f"Query {query_no} added"}


@router.post("/clients/{client_id}/cases/{case_id}/queries/{query_no}/upload")
def upload_query_doc(client_id: str, case_id: str, query_no: int, file: UploadFile = File(...)):
    cases, case = get_owned_case(client_id, case_id)

    query = next((q for q in case["queries"] if q["query_no"] == query_no), None)
    if not query:
        raise HTTPException(404, "Query not found")

    query["documents"].append(file.filename)
    query["updated_at"] = datetime.utcnow().isoformat()

    write_cases(cases)

    return {"message": "query doc uploaded"}
