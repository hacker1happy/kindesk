import secrets
import string

from app.repository.storage import read_data

ALPHANUM = string.ascii_uppercase + string.digits

## generate next sequential client ID
def generate_client_id():
    data = read_data()
    if not data:
        return "1"
    existing_ids = [int(client["id"]) for client in data]
    return str(max(existing_ids) + 1)

def generate_case_id():
    return ''.join(secrets.choice(ALPHANUM) for _ in range(7))
