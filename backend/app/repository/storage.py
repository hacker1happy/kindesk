import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = PROJECT_ROOT / "data"
UPLOADS_DIR = DATA_DIR / "uploads"

CLIENTS_DB_PATH = DATA_DIR / "clients.json"
CASES_DB_PATH = DATA_DIR / "cases.json"
COMPANIES_DB_PATH = DATA_DIR / "companies_master.json"
RTAS_DB_PATH = DATA_DIR / "rta_master.json"


def read_json(path):
    path = Path(path)
    if not path.exists():
        return {}
    with open(path, "r") as f:
        return json.load(f)


def write_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def read_clients():
    return read_json(CLIENTS_DB_PATH)


def write_clients(data):
    write_json(CLIENTS_DB_PATH, data)


def read_cases():
    return read_json(CASES_DB_PATH)


def write_cases(data):
    write_json(CASES_DB_PATH, data)


def read_companies():
    return read_json(COMPANIES_DB_PATH)


def read_rtas():
    return read_json(RTAS_DB_PATH)


def read_data():
    return read_clients()


def write_data(data):
    write_clients(data)
