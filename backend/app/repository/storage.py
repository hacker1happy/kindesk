import json
import os

DB_PATH = "data/clients.json"

def read_data():
    if not os.path.exists(DB_PATH):
        return []
    with open(DB_PATH, "r") as f:
        return json.load(f)

def write_data(data):
    with open(DB_PATH, "w") as f:
        json.dump(data, f, indent=2)