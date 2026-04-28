import uuid
from typing import List
from datetime import datetime
from fastapi import UploadFile, File, APIRouter, HTTPException

from app.repository.storage import read_data, write_data
from app.utils.document_utils import get_case_dir

router = APIRouter()


@router.put("/clients/{client_id}/cases/{case_id}/stages/{stage_key}")
def update_stage(client_id: str, case_id: str, stage_key: str):
    data = read_data()

    client = next((c for c in data if c["id"] == client_id), None)
    if not client:
        raise HTTPException(404, "Client not found")

    case = next((c for c in client["cases"] if c["case_id"] == case_id), None)
    if not case:
        raise HTTPException(404, "Case not found")

    stage = next((s for s in case["stages"] if s["key"] == stage_key), None)
    if not stage:
        raise HTTPException(404, "Stage not found")

    stage["completed"] = True
    stage["updated_at"] = datetime.now().isoformat()

    # ✅ Optional: update overall status
    case["status"] = stage_key

    write_data(data)

    return {"message": "stage updated"}



router = APIRouter()

@router.post("/clients/{client_id}/cases/{case_id}/stages/{stage_key}/upload")
async def upload_stage_documents(
    client_id: str,
    case_id: str,
    stage_key: str,
    files: List[UploadFile] = File(...)
):
    data = read_data()

    # 🔍 Find client, case, stage
    client = next((c for c in data if c["id"] == client_id), None)
    if not client:
        raise HTTPException(404, "Client not found")

    case = next((c for c in client["cases"] if c["case_id"] == case_id), None)
    if not case:
        raise HTTPException(404, "Case not found")

    stage = next((s for s in case["stages"] if s["key"] == stage_key), None)
    if not stage:
        raise HTTPException(404, "Stage not found")

    # 📁 Create stage-specific directory
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

        # ✅ Store full metadata instead of just filename
        stage.setdefault("documents", []).append(file_info)

    # ⏱ Update timestamp
    stage["updated_at"] = datetime.now().isoformat()

    write_data(data)

    return {
        "message": "files uploaded",
        "files": uploaded_files
    }

    
@router.post("/clients/{client_id}/cases/{case_id}/queries")
def add_query(client_id: str, case_id: str):
    data = read_data()

    client = next((c for c in data if c["id"] == client_id), None)
    case = next((c for c in client["cases"] if c["case_id"] == case_id), None)

    query_no = len(case.get("queries", [])) + 1

    new_query = {
        "query_no": query_no,
        "documents": [],
        "updated_at": None
    }

    case.setdefault("queries", []).append(new_query)

    write_data(data)

    return {"message": f"Query {query_no} added"}

@router.post("/clients/{client_id}/cases/{case_id}/queries/{query_no}/upload")
def upload_query_doc(client_id: str, case_id: str, query_no: int, file: UploadFile = File(...)):
    data = read_data()

    client = next((c for c in data if c["id"] == client_id), None)
    case = next((c for c in client["cases"] if c["case_id"] == case_id), None)

    query = next((q for q in case["queries"] if q["query_no"] == query_no), None)

    query["documents"].append(file.filename)
    query["updated_at"] = datetime.utcnow().isoformat()

    write_data(data)

    return {"message": "query doc uploaded"}
