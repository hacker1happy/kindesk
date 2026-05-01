import os
import shutil
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List

from app.repository.storage import UPLOADS_DIR, read_cases, read_clients, write_cases, write_clients
from app.utils.id_generator_utils import generate_client_id

router = APIRouter()

UPLOAD_DIR = UPLOADS_DIR
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
    comment: str = Form(""),
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
            "path": f"data/uploads/{client_id}/{file.filename}",
            "uploaded_at": datetime.now().isoformat()
        }

    new_client = {
        "name": name,
        "phone": phone,
        "assigned_to": assigned_to,
        "assigned_from": assigned_from,
        "comment": comment,
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


@router.put("/{client_id}")
def update_client(client_id: str, payload: dict):
    data = read_clients()
    client = data.get(client_id)

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    for field in ["name", "phone", "assigned_to", "assigned_from", "comment"]:
        if field in payload:
            client[field] = payload[field]

    client["updated_at"] = datetime.now().isoformat()
    write_clients(data)

    return {
        "message": "Client updated",
        "client": client
    }


@router.delete("/{client_id}")
def delete_client(client_id: str, payload: dict):
    confirmation = payload.get("confirmation_id")

    if confirmation != client_id:
        raise HTTPException(status_code=400, detail="Client ID confirmation does not match")

    clients = read_clients()
    cases = read_cases()
    client = clients.get(client_id)

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    for case_id in client.get("case_ids", []):
        cases.pop(case_id, None)

    client_dir = UPLOADS_DIR / client_id
    if client_dir.exists():
        shutil.rmtree(client_dir)

    del clients[client_id]
    write_cases(cases)
    write_clients(clients)

    return {"message": "Client deleted"}


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

    client.setdefault("files_info", {}).update({
        file.filename: {
            "path": f"data/uploads/{client_id}/{file.filename}",
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
    if isinstance(file_path, str):
        normalized_path = file_path.replace("\\", "/")
        if normalized_path.startswith("data/uploads/"):
            file_path = UPLOADS_DIR / normalized_path.removeprefix("data/uploads/")

    if os.path.exists(file_path):
        os.remove(file_path)

    del client["files_info"][file_name]

    write_clients(data)

    return {
        "message": "Document removed successfully"
    }

