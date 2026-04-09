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
    try:
        process = request.process
        data = duplicate_form_data_transformer.transform_input_data(request.data)
        selected_files = duplicate_form_data_transformer.transform_selected_files(request.selected_files)

        # Step 1: Modify data
        modified_data = modify_data(data, process)

        # Step 2: Build template paths
        template_files = build_template_paths(
            process,
            modified_data,
            selected_files
        )

        # Step 3: Output directory
        output_dir = os.path.join(
            "data",
            "uploads",
            client_id,
            case_id
        )
        os.makedirs(output_dir, exist_ok=True)

        # Step 4: Generate documents (ONLY this, no zip)
        generate_documents(template_files, output_dir, modified_data)

        # ✅ Return success instead of file
        return {
            "success": True,
            "message": "Documents generated successfully"
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }