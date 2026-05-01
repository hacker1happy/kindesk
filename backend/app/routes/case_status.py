import uuid
import zipfile
from datetime import datetime
from io import BytesIO
from typing import List

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse

from app.constants.helper_constants import DEFAULT_STAGES
from app.repository.storage import UPLOADS_DIR, read_cases, read_clients, write_cases
from app.utils.document_utils import get_case_dir

router = APIRouter()

STAGE_ORDER = [stage["key"] for stage in DEFAULT_STAGES]
QUERY_GATE_STAGE = "sent_to_rta"
QUERY_RESUME_STAGE = "loc_received"
OPTIONAL_DOCUMENT_STAGES = {
    "mail_sent",
    "iepf_generated",
    "everification",
    "shares_credited",
    "closed",
}


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


def get_stage(case, stage_key: str):
    stage = next((item for item in case.get("stages", []) if item["key"] == stage_key), None)
    if not stage:
        raise HTTPException(404, "Stage not found")
    return stage


def is_stage_completed(case, stage_key: str):
    return bool(get_stage(case, stage_key).get("completed"))


def has_open_query(case):
    return any(query.get("status") == "open" for query in case.get("queries", []))


def validate_stage_can_complete(case, stage_key: str):
    if stage_key not in STAGE_ORDER:
        raise HTTPException(404, "Stage not found")

    stage = get_stage(case, stage_key)
    if stage.get("completed"):
        return stage

    stage_index = STAGE_ORDER.index(stage_key)
    for previous_key in STAGE_ORDER[:stage_index]:
        if not is_stage_completed(case, previous_key):
            raise HTTPException(400, f"Complete {previous_key} before {stage_key}")

    if STAGE_ORDER.index(stage_key) >= STAGE_ORDER.index(QUERY_RESUME_STAGE) and has_open_query(case):
        raise HTTPException(400, "Close the open query before moving to the next stage")

    if stage_key not in OPTIONAL_DOCUMENT_STAGES and not stage.get("documents"):
        raise HTTPException(400, "Upload at least one document before marking this stage done")

    return stage


@router.put("/clients/{client_id}/cases/{case_id}/stages/{stage_key}")
def update_stage(client_id: str, case_id: str, stage_key: str):
    cases, case = get_owned_case(client_id, case_id)
    stage = validate_stage_can_complete(case, stage_key)

    stage["completed"] = True
    stage["updated_at"] = datetime.now().isoformat()
    case["status"] = "closed" if stage_key == "closed" else stage_key

    write_cases(cases)

    return {"message": "stage updated", "case": case}


@router.post("/clients/{client_id}/cases/{case_id}/stages/{stage_key}/upload")
async def upload_stage_documents(
    client_id: str,
    case_id: str,
    stage_key: str,
    files: List[UploadFile] = File(...)
):
    cases, case = get_owned_case(client_id, case_id)
    stage = get_stage(case, stage_key)

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
            "url": f"/data/uploads/{client_id}/{case_id}/{stage_key}/{unique_name}",
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


@router.post("/clients/{client_id}/cases/{case_id}/stages/{stage_key}/documents/replace")
async def replace_stage_document(
    client_id: str,
    case_id: str,
    stage_key: str,
    old_url: str = Form(...),
    file: UploadFile = File(...)
):
    cases, case = get_owned_case(client_id, case_id)
    stage = get_stage(case, stage_key)
    documents = stage.setdefault("documents", [])
    document_index = next((index for index, item in enumerate(documents) if item.get("url") == old_url), None)

    if document_index is None:
        raise HTTPException(404, "Document not found")

    old_file_path = get_case_dir(client_id, case_id) / stage_key / old_url.split("/")[-1]
    if old_file_path.exists():
        old_file_path.unlink()

    unique_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = get_case_dir(client_id, case_id) / stage_key / unique_name
    content = await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    documents[document_index] = {
        "name": file.filename,
        "url": f"/data/uploads/{client_id}/{case_id}/{stage_key}/{unique_name}",
        "uploaded_at": datetime.now().isoformat()
    }
    stage["updated_at"] = datetime.now().isoformat()
    write_cases(cases)

    return {"message": "stage document replaced", "document": documents[document_index]}


@router.delete("/clients/{client_id}/cases/{case_id}/stages/{stage_key}/documents")
def remove_stage_document(client_id: str, case_id: str, stage_key: str, url: str = Query(...)):
    cases, case = get_owned_case(client_id, case_id)
    stage = get_stage(case, stage_key)
    documents = stage.setdefault("documents", [])

    if stage_key not in OPTIONAL_DOCUMENT_STAGES and len(documents) <= 1:
        raise HTTPException(400, "At least one document must remain for this stage")

    document = next((item for item in documents if item.get("url") == url), None)
    if not document:
        raise HTTPException(404, "Document not found")

    file_path = get_case_dir(client_id, case_id) / stage_key / url.split("/")[-1]
    if file_path.exists():
        file_path.unlink()

    stage["documents"] = [item for item in documents if item.get("url") != url]
    stage["updated_at"] = datetime.now().isoformat()
    write_cases(cases)

    return {"message": "stage document removed"}


@router.post("/clients/{client_id}/cases/{case_id}/misc/upload")
async def upload_misc_documents(
    client_id: str,
    case_id: str,
    files: List[UploadFile] = File(...)
):
    cases, case = get_owned_case(client_id, case_id)
    misc_dir = get_case_dir(client_id, case_id) / "misc"
    misc_dir.mkdir(parents=True, exist_ok=True)

    uploaded_files = []

    for file in files:
        unique_name = f"{uuid.uuid4()}_{file.filename}"
        file_path = misc_dir / unique_name
        content = await file.read()

        with open(file_path, "wb") as buffer:
            buffer.write(content)

        file_info = {
            "name": file.filename,
            "url": f"/data/uploads/{client_id}/{case_id}/misc/{unique_name}",
            "uploaded_at": datetime.now().isoformat()
        }

        uploaded_files.append(file_info)
        case.setdefault("misc_documents", []).append(file_info)

    write_cases(cases)

    return {"message": "misc files uploaded", "files": uploaded_files}


@router.delete("/clients/{client_id}/cases/{case_id}/misc/documents")
def remove_misc_document(client_id: str, case_id: str, url: str = Query(...)):
    cases, case = get_owned_case(client_id, case_id)
    documents = case.setdefault("misc_documents", [])
    document = next((item for item in documents if item.get("url") == url), None)

    if not document:
        raise HTTPException(404, "Document not found")

    file_path = get_case_dir(client_id, case_id) / "misc" / url.split("/")[-1]
    if file_path.exists():
        file_path.unlink()

    case["misc_documents"] = [item for item in documents if item.get("url") != url]
    write_cases(cases)

    return {"message": "misc document removed"}


def build_documents_zip(documents, filename):
    buffer = BytesIO()

    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for document in documents:
            url = document.get("url", "")
            if not url:
                continue

            relative_path = url.removeprefix("/data/uploads/")
            file_path = UPLOADS_DIR / relative_path
            if file_path.exists() and file_path.is_file():
                zip_file.write(file_path, arcname=document.get("name") or file_path.name)

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/clients/{client_id}/cases/{case_id}/stages/documents/download-all")
def download_all_stage_documents(client_id: str, case_id: str):
    _, case = get_owned_case(client_id, case_id)
    documents = []

    for stage in case.get("stages", []):
        documents.extend(stage.get("documents", []))

    for query in case.get("queries", []):
        documents.extend(query.get("documents", []))

    return build_documents_zip(documents, f"{case_id}_stage_documents.zip")


@router.get("/clients/{client_id}/cases/{case_id}/stages/{stage_key}/documents/download-all")
def download_stage_documents(client_id: str, case_id: str, stage_key: str):
    _, case = get_owned_case(client_id, case_id)
    stage = get_stage(case, stage_key)

    return build_documents_zip(stage.get("documents", []), f"{case_id}_{stage_key}_documents.zip")


@router.post("/clients/{client_id}/cases/{case_id}/queries")
def add_query(client_id: str, case_id: str, payload: dict):
    cases, case = get_owned_case(client_id, case_id)

    if not is_stage_completed(case, QUERY_GATE_STAGE):
        raise HTTPException(400, "Complete Sent to Company/RTA before opening a query")

    if is_stage_completed(case, QUERY_RESUME_STAGE):
        raise HTTPException(400, "Queries cannot be opened after LOC/LOE is received")

    if has_open_query(case):
        raise HTTPException(400, "Close the open query before adding another query")

    details = (payload.get("details") or "").strip()
    if not details:
        raise HTTPException(400, "Query details are required")

    if len(details) > 1000:
        raise HTTPException(400, "Query details cannot exceed 1000 characters")

    query_no = len(case.get("queries", [])) + 1
    now = datetime.now().isoformat()

    new_query = {
        "query_no": query_no,
        "status": "open",
        "documents": [],
        "details": details,
        "opened_at": now,
        "closed_at": None,
        "updated_at": now
    }

    case.setdefault("queries", []).append(new_query)
    case["status"] = f"q{query_no}_open"

    write_cases(cases)

    return {"message": f"Query {query_no} opened", "query": new_query}


@router.post("/clients/{client_id}/cases/{case_id}/queries/{query_no}/upload")
async def upload_query_doc(client_id: str, case_id: str, query_no: int, file: UploadFile = File(...)):
    cases, case = get_owned_case(client_id, case_id)

    query = next((item for item in case.get("queries", []) if item["query_no"] == query_no), None)
    if not query:
        raise HTTPException(404, "Query not found")

    if query.get("status") == "closed":
        raise HTTPException(400, "Cannot upload documents to a closed query")

    query_dir = get_case_dir(client_id, case_id) / f"query_{query_no}"
    query_dir.mkdir(parents=True, exist_ok=True)

    unique_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = query_dir / unique_name
    content = await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    file_info = {
        "name": file.filename,
        "url": f"/data/uploads/{client_id}/{case_id}/query_{query_no}/{unique_name}",
        "uploaded_at": datetime.now().isoformat()
    }

    query.setdefault("documents", []).append(file_info)
    query["updated_at"] = datetime.now().isoformat()

    write_cases(cases)

    return {"message": "query doc uploaded", "file": file_info}


@router.post("/clients/{client_id}/cases/{case_id}/queries/{query_no}/documents/replace")
async def replace_query_doc(
    client_id: str,
    case_id: str,
    query_no: int,
    old_url: str = Form(...),
    file: UploadFile = File(...)
):
    cases, case = get_owned_case(client_id, case_id)
    query = next((item for item in case.get("queries", []) if item["query_no"] == query_no), None)
    if not query:
        raise HTTPException(404, "Query not found")

    documents = query.setdefault("documents", [])
    document_index = next((index for index, item in enumerate(documents) if item.get("url") == old_url), None)
    if document_index is None:
        raise HTTPException(404, "Document not found")

    query_dir = get_case_dir(client_id, case_id) / f"query_{query_no}"
    old_file_path = query_dir / old_url.split("/")[-1]
    if old_file_path.exists():
        old_file_path.unlink()

    unique_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = query_dir / unique_name
    content = await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    documents[document_index] = {
        "name": file.filename,
        "url": f"/data/uploads/{client_id}/{case_id}/query_{query_no}/{unique_name}",
        "uploaded_at": datetime.now().isoformat()
    }
    query["updated_at"] = datetime.now().isoformat()
    write_cases(cases)

    return {"message": "query document replaced", "document": documents[document_index]}


@router.delete("/clients/{client_id}/cases/{case_id}/queries/{query_no}/documents")
def remove_query_doc(client_id: str, case_id: str, query_no: int, url: str = Query(...)):
    cases, case = get_owned_case(client_id, case_id)
    query = next((item for item in case.get("queries", []) if item["query_no"] == query_no), None)
    if not query:
        raise HTTPException(404, "Query not found")

    documents = query.setdefault("documents", [])
    if len(documents) <= 1:
        raise HTTPException(400, "At least one document must remain for this query")

    document = next((item for item in documents if item.get("url") == url), None)
    if not document:
        raise HTTPException(404, "Document not found")

    file_path = get_case_dir(client_id, case_id) / f"query_{query_no}" / url.split("/")[-1]
    if file_path.exists():
        file_path.unlink()

    query["documents"] = [item for item in documents if item.get("url") != url]
    query["updated_at"] = datetime.now().isoformat()
    write_cases(cases)

    return {"message": "query document removed"}


@router.put("/clients/{client_id}/cases/{case_id}/queries/{query_no}/close")
def close_query(client_id: str, case_id: str, query_no: int):
    cases, case = get_owned_case(client_id, case_id)

    query = next((item for item in case.get("queries", []) if item["query_no"] == query_no), None)
    if not query:
        raise HTTPException(404, "Query not found")

    if query.get("status") == "closed":
        return {"message": f"Query {query_no} already closed", "query": query}

    if not query.get("documents"):
        raise HTTPException(400, "Upload at least one query document before closing")

    now = datetime.now().isoformat()
    query["status"] = "closed"
    query["closed_at"] = now
    query["updated_at"] = now
    case["status"] = f"q{query_no}_closed"

    write_cases(cases)

    return {"message": f"Query {query_no} closed", "query": query}
