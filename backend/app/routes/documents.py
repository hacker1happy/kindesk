from fastapi import APIRouter
from fastapi.responses import FileResponse
import os
import zipfile

from app.models.document_schema import DocumentRequest
from app.services.data_modifier import modify_data
from app.services.template_selector import build_template_paths
from app.services.file_generator import generate_documents
from app.utils import duplicate_form_data_transformer

router = APIRouter()


@router.post("/generate/{client_id}/{case_id}")
def generate_documents_api(client_id: str, case_id: str, request: DocumentRequest):
    process = request.process
    data = duplicate_form_data_transformer.transform_input_data(request.data)
    selected_files = duplicate_form_data_transformer.transform_selected_files(request.selected_files)

    # Step 1: Modify data
    modified_data = modify_data(data, process)

    # Step 2: Build template paths using selected files
    template_files = build_template_paths(
        process,
        modified_data,
        selected_files
    )

    # Step 3: Generate docs
    output_dir = os.path.join(
        "data",
        "uploads",
        client_id,
        case_id
    )

    os.makedirs(output_dir, exist_ok=True)

    generate_documents(template_files, output_dir, modified_data)

    # Step 4: Zip
    zip_path = output_dir + ".zip"
    with zipfile.ZipFile(zip_path, "w") as zipf:
        for file in os.listdir(output_dir):
            zipf.write(os.path.join(output_dir, file), file)

    return FileResponse(
        zip_path,
        media_type="application/zip",
        filename="documents.zip"
    )