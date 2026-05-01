from fastapi import APIRouter
import os
from datetime import datetime

from app.models.document_schema import DocumentRequest
from app.services.data_modifier import modify_data
from app.services.template_selector import build_template_paths
from app.services.file_generator import generate_documents
from app.utils.process_registry import get_process_config
from app.routes.fill_form import enrich_form_data_for_case, get_owned_case, save_form_data
from app.repository.storage import UPLOADS_DIR, write_cases

router = APIRouter()

GENERATION_REQUIRED_STAGES = {"mail_sent", "client_docs_received"}


def documents_ready_for_generation(case: dict) -> bool:
    completed_stage_keys = {
        stage.get("key")
        for stage in case.get("stages", [])
        if stage.get("completed")
    }

    return GENERATION_REQUIRED_STAGES.issubset(completed_stage_keys)


@router.post("/generate/{client_id}/{case_id}")
def generate_documents_api(client_id: str, case_id: str, request: DocumentRequest):
    try:
        process = request.process
        cases, case = get_owned_case(client_id, case_id)
        if not documents_ready_for_generation(case):
            return {
                "success": False,
                "message": "Complete Mail Sent to Client and Client Docs Received before generating documents"
            }

        process_config = get_process_config(process)
        form_data = enrich_form_data_for_case(case, request.data)
        data = process_config.transformer(form_data)
        selected_files = process_config.selected_files_transformer(request.selected_files)

        save_form_data(client_id, case_id, form_data)
        case["form_data"] = form_data

        # Step 1: Modify data
        modified_data = modify_data(data, process)

        # Step 2: Build template paths
        template_files = build_template_paths(
            process,
            modified_data,
            selected_files
        )

        # Step 3: Output directory
        output_dir = os.path.join(UPLOADS_DIR, client_id, case_id, "doc_generated")
        os.makedirs(output_dir, exist_ok=True)

        # Step 4: Generate documents (ONLY this, no zip)
        generate_documents(template_files, output_dir, modified_data)

        # Step 5: Store generated files in the Document Generated stage
        doc_generated_stage = next(
            (stage for stage in case.get("stages", []) if stage.get("key") == "doc_generated"),
            None
        )

        if doc_generated_stage is not None:
            generated_documents = []
            for file_name in selected_files:
                file_path = os.path.join(output_dir, file_name)
                if os.path.exists(file_path):
                    generated_documents.append({
                        "name": file_name,
                        "url": f"/data/uploads/{client_id}/{case_id}/doc_generated/{file_name}",
                        "uploaded_at": datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat(),
                    })

            existing_urls = {
                document.get("url")
                for document in doc_generated_stage.setdefault("documents", [])
            }
            doc_generated_stage["documents"].extend(
                document for document in generated_documents if document.get("url") not in existing_urls
            )
            doc_generated_stage["completed"] = True
            doc_generated_stage["updated_at"] = datetime.now().isoformat()
            case["status"] = "doc_generated"

        case["files"] = list(set([*case.get("files", []), *selected_files]))
        write_cases(cases)


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

