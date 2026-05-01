from fastapi import HTTPException

from app.repository.storage import UPLOADS_DIR, read_cases, read_clients, write_cases


BASE_UPLOAD_DIR = UPLOADS_DIR
BASE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def get_case_dir(client_id: str, case_id: str):
    case_dir = BASE_UPLOAD_DIR / client_id / case_id
    case_dir.mkdir(parents=True, exist_ok=True)
    return case_dir


def get_owned_case(client_id: str, case_id: str):
    clients = read_clients()
    cases = read_cases()

    client = clients.get(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if case_id not in client.get("case_ids", []):
        raise HTTPException(status_code=404, detail="Case not found")

    case = cases.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return cases, case


def save_files_data(client_id: str, case_id: str, files_data: list):
    cases, case = get_owned_case(client_id, case_id)

    existing_files = case.get("files", [])
    existing_files.extend(files_data)
    case["files"] = list(set(existing_files))

    write_cases(cases)

    return case["files"]


def remove_file_data(client_id: str, case_id: str, filename: str):
    cases, case = get_owned_case(client_id, case_id)

    existing_files = case.get("files", [])
    if filename in existing_files:
        existing_files.remove(filename)
        case["files"] = existing_files
        write_cases(cases)
