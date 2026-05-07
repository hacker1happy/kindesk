import os
import zipfile
from io import BytesIO
from datetime import datetime

from typing import List
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse

from app.utils.document_utils import get_case_dir, remove_file_data, save_files_data
from app.utils.upload_validation import (
    build_stored_filename,
    case_upload_names,
    ensure_not_duplicate,
    ensure_unique_batch,
    read_validated_upload,
)
from app.repository.storage import read_cases

router = APIRouter()


def generated_doc_sort_key(item):
    name = item["name"]
    prefix = name.split(".", 1)[0]
    return int(prefix) if prefix.isdigit() else 9999

@router.post("/clients/{client_id}/cases/{case_id}/upload")
async def upload_documents(
    client_id: str,
    case_id: str,
    files: List[UploadFile] = File(...)
):
    case_dir = get_case_dir(client_id, case_id)
    case_dir.mkdir(parents=True, exist_ok=True)
    
    uploaded_files = []
    cases = read_cases()
    case = cases.get(case_id, {})
    existing_names = case_upload_names(case)
    ensure_unique_batch(files)

    for file in files:
        filename, content = await read_validated_upload(file)
        ensure_not_duplicate(filename, existing_names)

        unique_name = build_stored_filename(filename)
        file_path = case_dir / unique_name

        with open(file_path, "wb") as buffer:
            buffer.write(content)

        uploaded_files.append({
            "name": filename,
            "stored_name": unique_name,
            "url": f"/data/uploads/{client_id}/{case_id}/{unique_name}",
            "uploaded_at": datetime.now().isoformat()
        })
        existing_names.add(filename)

    save_files_data(client_id, case_id, [file["name"] for file in uploaded_files])

    return {"files": uploaded_files}

@router.get("/clients/{client_id}/cases/{case_id}/files")
def list_documents(client_id: str, case_id: str):
    case_dir = get_case_dir(client_id, case_id)

    if not case_dir.exists():
        return {"files": []}
    
    files = []
    for file_name in os.listdir(case_dir):
        file_path = case_dir / file_name
        if not file_path.is_file():
            continue

        files.append({
            "name": file_name,
            "stored_name": file_name,
            "url": f"/data/uploads/{client_id}/{case_id}/{file_name}",
            "uploaded_at": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
        })

    return {"files": sorted(files, key=generated_doc_sort_key)}


@router.get("/clients/{client_id}/cases/{case_id}/files/download-all")
def download_all_documents(client_id: str, case_id: str):
    case_dir = get_case_dir(client_id, case_id)
    buffer = BytesIO()

    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
      for file_name in sorted(os.listdir(case_dir)):
          file_path = case_dir / file_name
          if file_path.is_file():
              zip_file.write(file_path, arcname=file_name)

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={case_id}_generated_documents.zip"}
    )


@router.delete("/clients/{client_id}/cases/{case_id}/file")
def delete_document(
    client_id: str,
    case_id: str,
    filename: str = Query(...)
):
    case_dir = get_case_dir(client_id, case_id)
    file_path = case_dir / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    os.remove(file_path)
    remove_file_data(client_id, case_id, filename)
    return {"message": "File deleted successfully"}

