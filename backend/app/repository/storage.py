import json
import os

CLIENTS_DB_PATH = "data/clients.json"
CASES_DB_PATH = "data/cases.json"


def read_json(path):
    if not os.path.exists(path):
        return {}
    with open(path, "r") as f:
        return json.load(f)


def write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
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


def read_data():
    return read_clients()


def write_data(data):
    write_clients(data)
