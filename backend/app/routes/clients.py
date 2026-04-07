from fastapi import APIRouter, UploadFile, File, Form
from datetime import datetime
from typing import List
import os

from app.repository.storage import read_data, write_data
from app.utils.utils import generate_client_id

router = APIRouter()

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/")
def get_clients():
    return read_data()


@router.post("/")
async def create_client(
    name: str = Form(...),
    phone: str = Form(...),
    assigned_to: str = Form(...),
    assigned_from: str = Form(...),
    files: List[UploadFile] = File([])
):
    data = read_data()

    client_id = generate_client_id()
    file_paths = []

    for file in files:
        path = f"{UPLOAD_DIR}/{client_id}_{file.filename}"
        with open(path, "wb") as f:
            f.write(await file.read())
        file_paths.append(path)

    new_client = {
        "id": client_id,
        "name": name,
        "phone": phone,
        "assigned_to": assigned_to,
        "assigned_from": assigned_from,
        "created_at": datetime.now().isoformat(),
        "files": file_paths
    }

    data.append(new_client)
    write_data(data)

    return {"message": "Client created", "client": new_client}

@router.get("/{client_id}")
def get_client(client_id: str):
    data = read_data()
    for client in data:
        if client["id"] == client_id:
            return client
    return {"error": "Client not found"}