import os
import uuid

from typing import List
from fastapi import APIRouter, File, HTTPException, HTTPException, Query, UploadFile

from app.utils.document_utils import get_case_dir, save_files_data

router = APIRouter()

@router.post("/clients/{client_id}/cases/{case_id}/upload")
async def upload_documents(
    client_id: str,
    case_id: str,
    files: List[UploadFile] = File(...)
):
    case_dir = get_case_dir(client_id, case_id)
    case_dir.mkdir(parents=True, exist_ok=True)
    
    uploaded_files = []

    for file in files:
        unique_name = f"{uuid.uuid4()}_{file.filename}"
        file_path = case_dir / unique_name

        content = await file.read()

        with open(file_path, "wb") as buffer:
            buffer.write(content)

        uploaded_files.append({
            "name": file.filename,
            "url": f"/data/uploads/{client_id}/{case_id}/{unique_name}"
        })

    save_files_data(client_id, case_id, [file.filename for file in files])

    return {"files": uploaded_files}

@router.get("/clients/{client_id}/cases/{case_id}/files")
def list_documents(client_id: str, case_id: str):
    case_dir = get_case_dir(client_id, case_id)

    if not case_dir.exists():
        return {"files": []}
    
    files = []
    for file_name in os.listdir(case_dir):
        files.append({
            "name": file_name,
            "url": f"/data/uploads/{client_id}/{case_id}/{file_name}"
        })

    return {"files": files}


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
    save_files_data(client_id, case_id, [filename])  # remove from case data
    return {"message": "File deleted successfully"}

