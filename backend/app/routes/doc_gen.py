from fastapi import APIRouter
import os

from app.models.document_schema import DocumentRequest
from app.services.data_modifier import modify_data
from app.services.template_selector import build_template_paths
from app.services.file_generator import generate_documents
from app.utils import duplicate_form_data_transformer
from app.routes.fill_form import enrich_form_data_for_case, get_owned_case, save_form_data
from app.repository.storage import UPLOADS_DIR
from app.utils.document_utils import save_files_data

router = APIRouter()


@router.post("/generate/{client_id}/{case_id}")
def generate_documents_api(client_id: str, case_id: str, request: DocumentRequest):
    try:
        process = request.process
        _, case = get_owned_case(client_id, case_id)
        form_data = enrich_form_data_for_case(case, request.data)
        data = duplicate_form_data_transformer.transform_input_data(form_data)
        selected_files = duplicate_form_data_transformer.transform_selected_files(request.selected_files)

        save_form_data(client_id, case_id, form_data)

        # Step 1: Modify data
        modified_data = modify_data(data, process)

        # Step 2: Build template paths
        template_files = build_template_paths(
            process,
            modified_data,
            selected_files
        )

        # Step 3: Output directory
        output_dir = os.path.join(UPLOADS_DIR, client_id, case_id)
        os.makedirs(output_dir, exist_ok=True)

        # Step 4: Generate documents (ONLY this, no zip)
        generate_documents(template_files, output_dir, modified_data)

        # Step 5: save the selected files into case.files
        save_files_data(client_id, case_id, selected_files)


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

