import os
import uuid
from pathlib import Path, PurePath

from fastapi import HTTPException, UploadFile


ALLOWED_UPLOAD_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".jpeg", ".jpg", ".png", ".txt"}
DEFAULT_MAX_UPLOAD_MB = 10


def get_max_upload_mb():
    try:
        configured_value = int(os.getenv("TRACKSURE_MAX_UPLOAD_MB", DEFAULT_MAX_UPLOAD_MB))
    except ValueError:
        configured_value = DEFAULT_MAX_UPLOAD_MB

    return max(1, configured_value)


def normalize_filename(filename: str | None):
    normalized = PurePath(str(filename or "").replace("\\", "/")).name.strip()
    if not normalized:
        raise HTTPException(400, "Uploaded file must have a filename")

    return normalized


def normalize_filename_key(filename: str | None):
    return normalize_filename(filename).casefold()


def validate_extension(filename: str):
    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_UPLOAD_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_UPLOAD_EXTENSIONS))
        raise HTTPException(400, f"Unsupported file type for {filename}. Allowed types: {allowed}")


def validate_file_size(filename: str, content: bytes):
    max_bytes = get_max_upload_mb() * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(400, f"{filename} exceeds the {get_max_upload_mb()} MB upload limit")


async def read_validated_upload(file: UploadFile):
    filename = normalize_filename(file.filename)
    validate_extension(filename)
    content = await file.read()
    validate_file_size(filename, content)

    return filename, content


def ensure_unique_batch(files):
    seen = set()
    duplicates = []

    for file in files:
        filename = normalize_filename(file.filename)
        key = filename.casefold()
        if key in seen:
            duplicates.append(filename)
        seen.add(key)

    if duplicates:
        raise HTTPException(400, f"Duplicate file selected: {', '.join(sorted(set(duplicates)))}")


def ensure_not_duplicate(filename: str, existing_names, current_name: str | None = None):
    filename_key = normalize_filename_key(filename)
    current_key = normalize_filename_key(current_name) if current_name else None

    for existing_name in existing_names:
        existing_key = normalize_filename_key(existing_name)
        if existing_key == filename_key and existing_key != current_key:
            raise HTTPException(400, f"{filename} is already uploaded for this record")


def build_stored_filename(filename: str):
    return f"{uuid.uuid4()}_{filename}"


def case_upload_names(case):
    names = set()

    for filename in case.get("files", []) or []:
        if filename:
            names.add(filename)

    for stage in case.get("stages", []) or []:
        for document in stage.get("documents", []) or []:
            if document.get("name"):
                names.add(document["name"])

    for query in case.get("queries", []) or []:
        for document in query.get("documents", []) or []:
            if document.get("name"):
                names.add(document["name"])

    for document in case.get("misc_documents", []) or []:
        if document.get("name"):
            names.add(document["name"])

    return names


def client_upload_names(client):
    return set((client.get("files_info") or {}).keys())
