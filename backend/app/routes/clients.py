import os
import shutil
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List

from app.repository.storage import read_clients, write_clients
from app.utils.id_generator_utils import generate_client_id

router = APIRouter()

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/")
def get_clients():
    return read_clients()


@router.post("/")
async def create_client(
    name: str = Form(...),
    phone: str = Form(...),
    assigned_to: str = Form(...),
    assigned_from: str = Form(...),
    files: List[UploadFile] = File([])
):
    data = read_clients()

    client_id = generate_client_id()
    client_dir = os.path.join(UPLOAD_DIR, client_id)

    os.makedirs(client_dir, exist_ok=True)

    files_info = {}

    for file in files:
        path = os.path.join(client_dir, file.filename)

        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        files_info[file.filename] = {
            "path": path,
            "uploaded_at": datetime.now().isoformat()
        }

    new_client = {
        "name": name,
        "phone": phone,
        "assigned_to": assigned_to,
        "assigned_from": assigned_from,
        "created_at": datetime.now().isoformat(),
        "files_info": files_info,
        "case_ids": []
    }

    data[client_id] = new_client
    write_clients(data)

    return {
        "message": "Client created",
        "client_id": client_id,
        "client": new_client
    }


@router.get("/{client_id}")
def get_client(client_id: str):
    data = read_clients()
    if client_id in data:
        return data[client_id]
    return {"error": "Client not found"}


@router.post("/{client_id}/documents")
async def upload_client_documents(
    client_id: str,
    files: List[UploadFile] = File(...)
):
    data = read_clients()

    client = data.get(client_id)

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client not found"
        )

    client_dir = os.path.join(UPLOAD_DIR, client_id)

    os.makedirs(client_dir, exist_ok=True)

    uploaded_files = []

    for file in files:
        path = os.path.join(client_dir, file.filename)

        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        uploaded_files.append(path)

    client["files_info"].update({
        file.filename: {
            "path": path,
            "uploaded_at": datetime.now().isoformat()
        }
        for file in files
    })

    write_clients(data)

    return {
        "message": "Documents uploaded successfully",
        "files_info": client["files_info"]
    }


@router.delete("/{client_id}/documents/{file_name}")
async def remove_client_document(
    client_id: str,
    file_name: str
):
    data = read_clients()

    client = data.get(client_id)

    if not client:
        raise HTTPException(
            status_code=404,
            detail="Client not found"
        )

    file_info = client.get("files_info", {}).get(file_name)

    if not file_info:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    file_path = file_info["path"]

    # Remove from disk
    if os.path.exists(file_path):
        os.remove(file_path)

    # Remove from JSON
    del client["files_info"][file_name]

    write_clients(data)

    return {
        "message": "Document removed successfully"
    }

