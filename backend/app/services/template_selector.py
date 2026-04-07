import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_ROOT = os.path.join(BASE_DIR, "templates", "word-template")


def build_template_paths(process, data, selected_files):

    process = process.lower()

    # Determine correct folder
    if process == "duplicate":
        N = data.get("NumberOfShareHolders", "1")
        dir_name = f"NumberOfShareHolders{N}"

    elif process in ["transmission", "both"]:
        N = data.get("NumberOfLegalHeirs", "1")
        dir_name = f"NumberOfLegalHeirs{N}"

    else:
        raise ValueError("Invalid process type")

    template_folder = os.path.join(TEMPLATE_ROOT, process, dir_name)

    full_paths = []

    for file_name in selected_files:
        file_path = os.path.join(template_folder, file_name)

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Template not found: {file_name}")

        full_paths.append(file_path)

    return full_paths