from collections import OrderedDict
from typing import Any, Dict, List

MAX_LEGAL_HEIRS = 3
MAX_SECURITIES = 4
CLAIMANT_STATUS = "claimant"
NON_CLAIMANT_STATUS = "non-claimant"
TRANSMISSION_FILE_NAME_MAPPING = {
    "auth-letter": "1. Authorization_Letter.docx",
    "request-letter": "2. Request_Letter.docx",
    "isr-1": "3. ISR1.docx",
    "sh-13": "4. SH-13.docx",
    "isr5-annexure-c": "8. ISR5-AnnexureC.docx",
    "annexure-d-heir-1": "9A. AnnexureD-Affidavit LEGAL HEIR 1.docx",
    "annexure-d-heir-2": "9A. AnnexureD-Affidavit LEGAL HEIR 2.docx",
    "annexure-d-heir-3": "9A. AnnexureD-Affidavit LEGAL HEIR 3.docx",
    "annexure-e-indemnity": "10. AnnexureE-Indemnity_from_LegalHeir.docx",
    "annexure-f-undertaking": "11. AnnexureF-Undertaking_from_LegalHeir.docx",
}
JOINT_FILE_NAME_MAPPING = {
    **TRANSMISSION_FILE_NAME_MAPPING,
    "isr-4": "5. ISR4.docx",
    "form-a": "6. FormA.docx",
    "form-b-indemnity": "7. FormB_Indemnity.docx",
}


def transform_input_data(payload: Dict[str, Any]) -> Dict[str, str]:
    data = OrderedDict()

    legal_heirs = payload.get("legalHeirs", [])
    shareholders = payload.get("shareholders", [])
    securities = payload.get("securities", [])
    company_info = payload.get("companyInfo", {})
    rta_info = payload.get("rtaInfo", {})
    other_info = payload.get("otherInfo", {})

    data["NumberOfLegalHeirs"] = str(len(legal_heirs))
    data["NumberOfShareHolders"] = str(len(shareholders))
    claimant_suffixes = []
    non_claimant_suffixes = []
    non_claimant_names = []

    for i in range(MAX_LEGAL_HEIRS):
        suffix = chr(ord("A") + i)

        if i < len(legal_heirs):
            heir = legal_heirs[i]
            claimant_status = (heir.get("claimantStatus") or CLAIMANT_STATUS).lower()
            if len(legal_heirs) == 1:
                claimant_status = CLAIMANT_STATUS

            is_non_claimant = claimant_status == NON_CLAIMANT_STATUS
            if is_non_claimant:
                non_claimant_suffixes.append(suffix)
            else:
                claimant_suffixes.append(suffix)

            personal = heir.get("personalDetails", {})
            contact = heir.get("contactDetails", {})
            bank = heir.get("bankDetails", {})
            name = personal.get("name", "")
            address = contact.get("address", "")
            pin_code = contact.get("pinCode", "")
            age = personal.get("age", "")
            relation = personal.get("relation", "")

            if is_non_claimant:
                non_claimant_names.append(name)

            data[f"LEGALHEIR{suffix}"] = name
            data[f"LHSIGN{suffix}"] = "" if is_non_claimant else name
            data[f"LH{suffix}FATHER"] = personal.get("fatherName", "")
            data[f"LH{suffix}PAN"] = personal.get("panNumber", "")
            data[f"LH{suffix}DEMAT"] = personal.get("dematAccount", "")
            data[f"LH{suffix}AGE"] = age
            data[f"LHAGE{suffix}"] = "" if is_non_claimant else age
            data[f"LH{suffix}RELATION"] = relation
            data[f"LHRELATION{suffix}"] = "" if is_non_claimant else relation
            data[f"LH{suffix}ADDRESS"] = address
            data[f"LHADDSIGN{suffix}"] = "" if is_non_claimant else address
            data[f"LH{suffix}PIN"] = pin_code
            data[f"LHPINSIGN{suffix}"] = "" if is_non_claimant else pin_code
            data[f"Email{suffix}"] = contact.get("email", "")
            data[f"Mobile{suffix}"] = contact.get("mobile", "")
            data[f"LH{suffix}ACCNO"] = bank.get("accountNumber", "")
            data[f"LH{suffix}BNKNAME"] = bank.get("bankName", "")
            data[f"LH{suffix}BNKBRANCH"] = bank.get("branch", "")
            data[f"LH{suffix}IFSC"] = bank.get("ifscCode", "")
            data[f"LH{suffix}MICR"] = bank.get("micrNumber", "")
            data[f"LH{suffix}BNKCITY"] = bank.get("bankCity", "")
            data[f"LH{suffix}BNKPIN"] = bank.get("bankPin", "")
            data[f"LH{suffix}CLAIMANTSTATUS"] = claimant_status
        else:
            for key in [
                "LEGALHEIR",
                "LHSIGN",
                "LH{suffix}FATHER",
                "LH{suffix}PAN",
                "LH{suffix}DEMAT",
                "LH{suffix}AGE",
                "LHAGE{suffix}",
                "LH{suffix}RELATION",
                "LHRELATION{suffix}",
                "LH{suffix}ADDRESS",
                "LHADDSIGN{suffix}",
                "LH{suffix}PIN",
                "LHPINSIGN{suffix}",
                "Email",
                "Mobile",
                "LH{suffix}ACCNO",
                "LH{suffix}BNKNAME",
                "LH{suffix}BNKBRANCH",
                "LH{suffix}IFSC",
                "LH{suffix}MICR",
                "LH{suffix}BNKCITY",
                "LH{suffix}BNKPIN",
                "LH{suffix}CLAIMANTSTATUS",
            ]:
                if "{suffix}" in key:
                    data[key.format(suffix=suffix)] = ""
                else:
                    data[f"{key}{suffix}"] = ""

        if i < len(shareholders):
            shareholder = shareholders[i]
            data[f"SH{suffix}NAME"] = shareholder.get("name", "")
            data[f"SH{suffix}DOD"] = shareholder.get("dateOfDemise", "")
        else:
            data[f"SH{suffix}NAME"] = ""
            data[f"SH{suffix}DOD"] = ""

    first_heir_contact = legal_heirs[0].get("contactDetails", {}) if legal_heirs else {}
    data["STATENAME"] = other_info.get("stateName", "") or first_heir_contact.get("state", "")
    data["CITYNAME"] = other_info.get("cityName", "") or first_heir_contact.get("city", "")
    data["FORMDATE"] = other_info.get("formDate", "")
    data["FACEVALUE"] = other_info.get("faceValue", "")
    data["FOLIONO"] = other_info.get("folioNumber", "")

    for i in range(MAX_SECURITIES):
        suffix = chr(ord("A") + i)

        if i < len(securities):
            security = securities[i]
            data[f"NOS{suffix}"] = security.get("shares", "")
            data[f"CERTNO{suffix}"] = security.get("certificateNumber", "")
            data[f"DISTNOFROM{suffix}"] = security.get("distinctiveFrom", "")
            data[f"DISTNOTO{suffix}"] = security.get("distinctiveTo", "")
        else:
            data[f"NOS{suffix}"] = ""
            data[f"CERTNO{suffix}"] = ""
            data[f"DISTNOFROM{suffix}"] = ""
            data[f"DISTNOTO{suffix}"] = ""

    data["NUMBEROFSHARES"] = str(payload.get("totalShares", ""))
    data["NAMEOFTHECOMPANY"] = company_info.get("name", "")
    data["ADDRESSOFTHECOMPANY"] = company_info.get("address", "")
    data["NAMEOFTHEREGISTRAR"] = rta_info.get("name", "")
    data["ADDRESSOFTHEREGISTRAR"] = rta_info.get("address", "")
    data["_CLAIMANT_SUFFIXES"] = claimant_suffixes
    data["_NON_CLAIMANT_SUFFIXES"] = non_claimant_suffixes

    for i in range(MAX_LEGAL_HEIRS):
        suffix = chr(ord("A") + i)
        data[f"NONCLAIMANT{suffix}"] = non_claimant_names[i] if i < len(non_claimant_names) else ""

    return data


def transform_selected_files(selected_files: List[str]) -> List[str]:
    return [
        TRANSMISSION_FILE_NAME_MAPPING[file_id]
        for file_id in selected_files
        if file_id in TRANSMISSION_FILE_NAME_MAPPING
    ]


def transform_joint_selected_files(selected_files: List[str]) -> List[str]:
    return [
        JOINT_FILE_NAME_MAPPING[file_id]
        for file_id in selected_files
        if file_id in JOINT_FILE_NAME_MAPPING
    ]
