import string
import random

from app.repository.storage import read_clients, read_cases


def generate_client_id():
    data = read_clients()
    return f"CL{len(data) + 1:06d}"


def generate_case_id():
    chars = string.ascii_uppercase + string.digits
    cases = read_cases()

    while True:
        case_id = "CS" + "".join(random.choices(chars, k=7))
        if case_id not in cases:
            return case_id
