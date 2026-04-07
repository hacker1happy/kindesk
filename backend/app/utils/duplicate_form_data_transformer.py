from collections import OrderedDict
from typing import Dict, Any, List

MAX_SHAREHOLDERS = 3
MAX_SECURITIES = 4


def transform_input_data(payload: Dict[str, Any]) -> Dict[str, str]:
    data = OrderedDict()

    shareholders = payload.get("shareholders", [])
    securities = payload.get("securities", [])
    company_info = payload.get("companyInfo", {})
    rta_info = payload.get("rtaInfo", {})
    other_info = payload.get("otherInfo", {})

    # -------------------------------
    # Number of Shareholders
    # -------------------------------
    data["NumberOfShareHolders"] = str(len(shareholders))

    # -------------------------------
    # Shareholder Mapping (A-C)
    # -------------------------------
    for i in range(MAX_SHAREHOLDERS):
        suffix = chr(ord('A') + i)

        if i < len(shareholders):
            sh = shareholders[i]

            personal = sh.get("personalDetails", {})
            contact = sh.get("contactDetails", {})
            bank = sh.get("bankDetails", {})

            data[f"SIGNATURE{suffix}"] = personal.get("name", "")
            data[f"SHAREHOLDER{suffix}FATHER"] = personal.get("fatherName", "")
            data[f"SHAREHOLDER{suffix}PAN"] = personal.get("panNumber", "")
            data["SHAREHOLDERDEMATACCOUNT"] = personal.get("dematAccount", "") if suffix == "A" else data["SHAREHOLDERDEMATACCOUNT"]
            data[f"SHAREHOLDER{suffix}ADDRESS"] = contact.get("address", "")
            data[f"SHAREHOLDER{suffix}PINCODE"] = contact.get("pinCode", "")
            data[f"Email{suffix}"] = contact.get("email", "")
            data[f"Mobile{suffix}"] = contact.get("mobile", "")

            data[f"{suffix}ACCNO"] = bank.get("accountNumber", "")
            data[f"{suffix}BNKNAME"] = bank.get("bankName", "")
            data[f"{suffix}BRANCHNAME"] = bank.get("branch", "")
            data[f"{suffix}IFSCODE"] = bank.get("ifscCode", "")

        else:
            # Fill empty values if shareholder doesn't exist
            data[f"SIGNATURE{suffix}"] = ""
            data[f"SHAREHOLDER{suffix}FATHER"] = ""
            data[f"SHAREHOLDER{suffix}PAN"] = ""
            data[f"SHAREHOLDER{suffix}ADDRESS"] = ""
            data[f"SHAREHOLDER{suffix}PINCODE"] = ""
            data[f"Email{suffix}"] = ""
            data[f"Mobile{suffix}"] = ""
            data[f"{suffix}ACCNO"] = ""
            data[f"{suffix}BNKNAME"] = ""
            data[f"{suffix}BRANCHNAME"] = ""
            data[f"{suffix}IFSCODE"] = ""

    # -------------------------------
    # Other Info
    # -------------------------------
    data["FORMDATE"] = other_info.get("formDate", "")
    data["FACEVALUE"] = other_info.get("faceValue", "")
    data["FOLIONO"] = other_info.get("folioNumber", "")

    # -------------------------------
    # Securities Mapping (A-D)
    # -------------------------------
    for i in range(MAX_SECURITIES):
        suffix = chr(ord('A') + i)

        if i < len(securities):
            sec = securities[i]
            data[f"NOS{suffix}"] = sec.get("shares", "")
            data[f"CERTNO{suffix}"] = sec.get("certificateNumber", "")
            data[f"DISTNOFROM{suffix}"] = sec.get("distinctiveFrom", "")
            data[f"DISTNOTO{suffix}"] = sec.get("distinctiveTo", "")
        else:
            data[f"NOS{suffix}"] = ""
            data[f"CERTNO{suffix}"] = ""
            data[f"DISTNOFROM{suffix}"] = ""
            data[f"DISTNOTO{suffix}"] = ""

    # -------------------------------
    # Totals & Company Info
    # -------------------------------
    data["NUMBEROFSHARES"] = str(payload.get("totalShares", ""))

    data["NAMEOFTHECOMPANY"] = company_info.get("name", "")
    data["ADDRESSOFTHECOMPANY"] = company_info.get("address", "")

    data["NAMEOFTHEREGISTRAR"] = rta_info.get("name", "")
    data["ADDRESSOFTHEREGISTRAR"] = rta_info.get("address", "")

    return data


FILE_NAME_MAPPING = {
    "auth-letter": "1. Authorization_Letter.docx",
    "request-letter": "2. Request_Letter.docx",
    "isr-1": "3. ISR1.docx",
    "sh-13": "4. SH-13.docx",
    "isr-4": "5. ISR4.docx",
    "form-a": "6. FormA.docx",
    "form-b-indemnity": "7. FormB_Indemnity.docx",
}


def transform_selected_files(selected_files: List[str]) -> List[str]:
    """
    Transforms frontend document identifiers into
    numbered backend template filenames.
    """
    return [
        FILE_NAME_MAPPING[file_id]
        for file_id in selected_files
        if file_id in FILE_NAME_MAPPING
    ]