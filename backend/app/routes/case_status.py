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
QUERY_RESUME_STAGES = {"loc_received", "loe_received"}
IEPF_WORKFLOW_STAGES = {"iepf_generated", "iepf_submitted", "everification"}
OPTIONAL_DOCUMENT_STAGES = {
    "mail_sent",
    "doc_sent",
    "doc_received",
    "ops_review",
    "iepf_generated",
    "everification",
    "shares_credited",
    "closed",
}
BLOCKED_UPLOAD_STAGES = {"doc_generated", "ops_review", "everification"}
REQUIRED_DOCUMENT_TYPES = {
    "sent_to_rta": {
        "document_sent_to_company_rta": "Document sent to Company/RTA",
        "pod_receipt": "POD receipt",
    },
    "iepf_submitted": {
        "document_sent_to_company_rta": "Document sent to Company/RTA",
        "pod_receipt": "POD receipt",
    },
}
OPS_REVIEW_QUESTIONS = [
    {"key": "documents_verified", "label": "All required client documents verified"},
    {"key": "case_details_matched", "label": "Case details match company and folio records"},
    {"key": "rta_packet_ready", "label": "RTA submission packet is ready"},
    {"key": "exceptions_recorded", "label": "Exceptions or special notes are recorded"},
]


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

    normalize_case_stages(case)

    return cases, case


def normalize_case_stages(case):
    stages = case.setdefault("stages", [])
    by_key = {stage.get("key"): stage for stage in stages}
    normalized = []

    for default_stage in DEFAULT_STAGES:
        stage = by_key.get(default_stage["key"])
        if not stage:
            stage = {
                **default_stage,
                "completed": False,
                "updated_at": None,
                "documents": [],
            }
        else:
            stage["label"] = default_stage["label"]
            stage.setdefault("completed", False)
            stage.setdefault("updated_at", None)
            stage.setdefault("documents", [])

        normalized.append(stage)

    case["stages"] = normalized
    return normalized


def get_stage(case, stage_key: str):
    stage = next((item for item in case.get("stages", []) if item["key"] == stage_key), None)
    if not stage:
        raise HTTPException(404, "Stage not found")
    return stage


def is_stage_completed(case, stage_key: str):
    return bool(get_stage(case, stage_key).get("completed"))


def is_loc_workflow(case):
    return is_stage_completed(case, "loc_received")


def is_loe_workflow(case):
    return is_stage_completed(case, "loe_received")


def effective_stage_order(case):
    if is_loc_workflow(case):
        return [stage_key for stage_key in STAGE_ORDER if stage_key not in {"loe_received", *IEPF_WORKFLOW_STAGES}]

    if is_loe_workflow(case):
        return [stage_key for stage_key in STAGE_ORDER if stage_key != "loc_received"]

    return STAGE_ORDER


def has_open_query(case):
    return any(query.get("status") == "open" for query in case.get("queries", []))


def validate_stage_can_complete(case, stage_key: str, skip_stage_specific: bool = False):
    if stage_key not in STAGE_ORDER:
        raise HTTPException(404, "Stage not found")

    stage = get_stage(case, stage_key)
    if stage.get("completed"):
        return stage

    if stage_key == "closed":
        return stage

    if stage_key == "loc_received" and is_loe_workflow(case):
        raise HTTPException(400, "LOE Received is already completed for this case")

    if stage_key == "loe_received" and is_loc_workflow(case):
        raise HTTPException(400, "LOC Received is already completed for this case")

    active_stage_order = effective_stage_order(case)
    if not is_loc_workflow(case) and not is_loe_workflow(case) and stage_key == "loe_received":
        active_stage_order = [key for key in active_stage_order if key != "loc_received"]
    if stage_key not in active_stage_order:
        raise HTTPException(400, "This stage is not required for the selected workflow")

    stage_index = active_stage_order.index(stage_key)
    for previous_key in active_stage_order[:stage_index]:
        if not is_stage_completed(case, previous_key):
            raise HTTPException(400, f"Complete {previous_key} before {stage_key}")

    after_resume_stage = any(
        resume_stage in active_stage_order
        and stage_index >= active_stage_order.index(resume_stage)
        for resume_stage in QUERY_RESUME_STAGES
    )
    if after_resume_stage and has_open_query(case):
        raise HTTPException(400, "Close the open query before moving to the next stage")

    missing_document_types = get_missing_required_document_types(stage_key, stage)
    if missing_document_types:
        missing = ", ".join(missing_document_types.values())
        raise HTTPException(400, f"Upload required documents before marking this stage done: {missing}")

    if not skip_stage_specific and stage_key == "ops_review" and not stage.get("ops_review_form"):
        raise HTTPException(400, "Submit Ops Review & Sign-off form before marking this stage done")

    if not skip_stage_specific and stage_key == "everification":
        if stage.get("approval_status") != "approved":
            raise HTTPException(400, "Approve E-Verification before marking this stage done")

    if stage_key not in OPTIONAL_DOCUMENT_STAGES and not stage.get("documents"):
        raise HTTPException(400, "Upload at least one document before marking this stage done")

    return stage


def get_missing_required_document_types(stage_key, stage):
    required_types = REQUIRED_DOCUMENT_TYPES.get(stage_key)
    if not required_types:
        return {}

    uploaded_types = {
        document.get("document_type")
        for document in stage.get("documents", [])
        if document.get("document_type")
    }

    return {
        document_type: label
        for document_type, label in required_types.items()
        if document_type not in uploaded_types
    }


def refresh_case_status(case):
    completed_stages = [
        stage for stage in case.get("stages", [])
        if stage.get("completed") and stage.get("key") != "closed"
    ]

    if get_stage(case, "closed").get("completed"):
        case["status"] = "closed"
    elif completed_stages:
        case["status"] = completed_stages[-1].get("key")
    else:
        case["status"] = "fresh"


@router.put("/clients/{client_id}/cases/{case_id}/stages/{stage_key}")
def update_stage(client_id: str, case_id: str, stage_key: str, payload: dict | None = None):
    cases, case = get_owned_case(client_id, case_id)
    stage = validate_stage_can_complete(case, stage_key)
    now = datetime.now().isoformat()

    if stage_key == "closed":
        reason = ((payload or {}).get("reason") or "").strip()
        successful_closure = is_stage_completed(case, "shares_credited")
        if not reason and not successful_closure:
            raise HTTPException(400, "Closure reason is required")
        if not reason and successful_closure:
            reason = "Case closed after all workflow steps were completed successfully."

        case["closure_reason"] = reason
        case["closure_comment"] = {
            "comment": reason,
            "created_at": now,
            "stage_key": "closed",
        }

    stage["completed"] = True
    stage["updated_at"] = now
    case["status"] = "closed" if stage_key == "closed" else stage_key

    write_cases(cases)

    return {"message": "stage updated", "case": case}


@router.put("/clients/{client_id}/cases/{case_id}/stages/{stage_key}/revert")
def revert_stage(client_id: str, case_id: str, stage_key: str):
    cases, case = get_owned_case(client_id, case_id)

    if stage_key not in STAGE_ORDER:
        raise HTTPException(404, "Stage not found")

    active_stage_order = effective_stage_order(case)
    if stage_key not in active_stage_order:
        active_stage_order = STAGE_ORDER

    stage_index = active_stage_order.index(stage_key)
    now = datetime.now().isoformat()

    for key in active_stage_order[stage_index:]:
        stage = get_stage(case, key)
        stage["completed"] = False
        stage["updated_at"] = now

        if key == "ops_review":
            stage.pop("ops_review_form", None)
        if key == "everification":
            stage.pop("approval_status", None)
            stage.pop("approval_comment", None)
        if key == "closed":
            case.pop("closure_reason", None)
            case.pop("closure_comment", None)

    refresh_case_status(case)
    write_cases(cases)

    return {"message": "stage reverted", "case": case}


@router.post("/clients/{client_id}/cases/{case_id}/stages/ops_review/form")
def submit_ops_review_form(client_id: str, case_id: str, payload: dict):
    cases, case = get_owned_case(client_id, case_id)
    stage = validate_stage_can_complete(case, "ops_review", skip_stage_specific=True)

    answers = payload.get("answers") or {}
    save_as_draft = bool(payload.get("draft"))
    normalized_answers = {}

    for question in OPS_REVIEW_QUESTIONS:
        answer = answers.get(question["key"]) or {}
        value = answer.get("answer")
        if value not in {"", "yes", "no", None}:
            raise HTTPException(400, f"Answer yes or no for: {question['label']}")
        if not save_as_draft and value not in {"yes", "no"}:
            raise HTTPException(400, f"Answer yes or no for: {question['label']}")

        normalized_answers[question["key"]] = {
            "question": question["label"],
            "answer": value or "",
            "comment": (answer.get("comment") or "").strip(),
        }

    now = datetime.now().isoformat()
    previous_form = stage.get("ops_review_form") or {}
    stage["ops_review_form"] = {
        "questions": normalized_answers,
        "status": "draft" if save_as_draft else "submitted",
        "draft_saved_at": now if save_as_draft else previous_form.get("draft_saved_at"),
        "submitted_at": previous_form.get("submitted_at") if save_as_draft else now,
    }
    stage["completed"] = not save_as_draft
    stage["updated_at"] = now
    if not save_as_draft:
        case["status"] = "ops_review"

    write_cases(cases)

    return {"message": "Ops review form saved" if save_as_draft else "Ops review form submitted", "case": case}


@router.put("/clients/{client_id}/cases/{case_id}/stages/everification/decision")
def decide_everification(client_id: str, case_id: str, payload: dict):
    cases, case = get_owned_case(client_id, case_id)
    decision = payload.get("decision")
    comment = (payload.get("comment") or "").strip()

    if decision not in {"approved", "rejected"}:
        raise HTTPException(400, "Decision must be approved or rejected")

    if decision == "rejected" and not comment:
        raise HTTPException(400, "Comment is required when rejecting E-Verification")

    stage = get_stage(case, "everification")
    if decision == "approved":
        validate_stage_can_complete(case, "everification", skip_stage_specific=True)
    else:
        validate_stage_can_complete(case, "everification", skip_stage_specific=True)

    now = datetime.now().isoformat()
    stage["approval_status"] = decision
    stage["approval_comment"] = comment
    stage["updated_at"] = now

    if decision == "approved":
        stage["completed"] = True
        case["status"] = "everification"
    else:
        for reactivated_key in ["iepf_generated", "iepf_submitted", "everification"]:
            reactivated_stage = get_stage(case, reactivated_key)
            reactivated_stage["completed"] = False
            reactivated_stage["updated_at"] = now
        stage["approval_status"] = "rejected"
        case["status"] = "everification_rejected"

    write_cases(cases)

    return {"message": f"E-Verification {decision}", "case": case}


@router.post("/clients/{client_id}/cases/{case_id}/stages/{stage_key}/upload")
async def upload_stage_documents(
    client_id: str,
    case_id: str,
    stage_key: str,
    document_type: str | None = Form(None),
    files: List[UploadFile] = File(...)
):
    cases, case = get_owned_case(client_id, case_id)
    stage = get_stage(case, stage_key)

    if stage_key in BLOCKED_UPLOAD_STAGES:
        raise HTTPException(400, "Uploads are not allowed for this stage")

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
        if document_type:
            file_info["document_type"] = document_type
            file_info["document_label"] = REQUIRED_DOCUMENT_TYPES.get(stage_key, {}).get(document_type, document_type)

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

    old_document = documents[document_index]
    old_file_path = get_case_dir(client_id, case_id) / stage_key / old_url.split("/")[-1]
    if old_file_path.exists():
        old_file_path.unlink()

    unique_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = get_case_dir(client_id, case_id) / stage_key / unique_name
    content = await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    replacement_document = {
        "name": file.filename,
        "url": f"/data/uploads/{client_id}/{case_id}/{stage_key}/{unique_name}",
        "uploaded_at": datetime.now().isoformat()
    }
    for metadata_key in ["document_type", "document_label"]:
        if old_document.get(metadata_key):
            replacement_document[metadata_key] = old_document[metadata_key]

    documents[document_index] = replacement_document
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

    document_type = document.get("document_type")
    if document_type in REQUIRED_DOCUMENT_TYPES.get(stage_key, {}):
        same_type_count = sum(1 for item in documents if item.get("document_type") == document_type)
        if same_type_count <= 1:
            raise HTTPException(400, "Replace this required document instead of removing it")

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

    if any(is_stage_completed(case, resume_stage) for resume_stage in QUERY_RESUME_STAGES):
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
