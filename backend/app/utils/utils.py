import random
from datetime import datetime
import secrets

def generate_client_id():
    return str(random.randint(1000000, 9999999))

def generate_case_id():
    """Generate unique, sortable case ID"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_part = secrets.token_hex(3).upper()
    return f"CASE_{timestamp}_{random_part}"
# Example: CASE_20240331143025_A7F3B2