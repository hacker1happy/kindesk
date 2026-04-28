from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.repository.storage import read_data, write_data


app = FastAPI()

BASE_UPLOAD_DIR = Path("data/uploads")
BASE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/backend/data/uploads", StaticFiles(directory=BASE_UPLOAD_DIR), name="uploads")


def get_case_dir(client_id: str, case_id: str) -> Path:
    case_dir = BASE_UPLOAD_DIR / client_id / case_id
    case_dir.mkdir(parents=True, exist_ok=True)
    return case_dir

def save_files_data(client_id: str, case_id: str, files_data: list):
    data = read_data()

    client = next((c for c in data if c["id"] == client_id), None)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    case = next(
        (c for c in client.get("cases", []) if c["case_id"] == case_id),
        None
    )

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # avoid overwriting existing files data, append to it
    existing_files = case.get("files", [])
    existing_files.extend(files_data)
    case["files"] = list(set(existing_files))

    write_data(data)

    return case["files"]

def remove_file_data(client_id: str, case_id: str, filename: str):
    data = read_data()

    client = next((c for c in data if c["id"] == client_id), None)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    case = next(
        (c for c in client.get("cases", []) if c["case_id"] == case_id),
        None
    )

    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    existing_files = case.get("files", [])
    if filename in existing_files:
        existing_files.remove(filename)
        case["files"] = existing_files
        write_data(data)