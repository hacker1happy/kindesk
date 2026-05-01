from collections import OrderedDict
from typing import Any, Dict, List

MAX_LEGAL_HEIRS = 3
MAX_SECURITIES = 4


def transform_input_data(payload: Dict[str, Any]) -> Dict[str, str]:
    data = OrderedDict()

    legal_heirs = payload.get("legalHeirs", [])
    securities = payload.get("securities", [])
    company_info = payload.get("companyInfo", {})
    rta_info = payload.get("rtaInfo", {})
    other_info = payload.get("otherInfo", {})

    data["NumberOfLegalHeirs"] = str(len(legal_heirs))
    data["NumberOfShareHolders"] = str(len(legal_heirs))

    for i in range(MAX_LEGAL_HEIRS):
        suffix = chr(ord("A") + i)

        if i < len(legal_heirs):
            heir = legal_heirs[i]
            personal = heir.get("personalDetails", {})
            contact = heir.get("contactDetails", {})
            deceased = heir.get("deceasedShareholder", {})
            bank = heir.get("bankDetails", {})

            data[f"LEGALHEIR{suffix}"] = personal.get("name", "")
            data[f"LH{suffix}FATHER"] = personal.get("fatherName", "")
            data[f"LH{suffix}PAN"] = personal.get("panNumber", "")
            data[f"LH{suffix}DEMAT"] = personal.get("dematAccount", "")
            data[f"LH{suffix}AGE"] = personal.get("age", "")
            data[f"LH{suffix}RELATION"] = personal.get("relation", "")
            data[f"LH{suffix}ADDRESS"] = contact.get("address", "")
            data[f"LH{suffix}PIN"] = contact.get("pinCode", "")
            data[f"Email{suffix}"] = contact.get("email", "")
            data[f"Mobile{suffix}"] = contact.get("mobile", "")
            data[f"SH{suffix}NAME"] = deceased.get("name", "")
            data[f"SH{suffix}DOD"] = deceased.get("dateOfDemise", "")
            data[f"LH{suffix}ACCNO"] = bank.get("accountNumber", "")
            data[f"LH{suffix}BNKNAME"] = bank.get("bankName", "")
            data[f"LH{suffix}BNKBRANCH"] = bank.get("branch", "")
            data[f"LH{suffix}IFSC"] = bank.get("ifscCode", "")
            data[f"LH{suffix}MICR"] = bank.get("micrNumber", "")
            data[f"LH{suffix}BNKCITY"] = bank.get("bankCity", "")
            data[f"LH{suffix}BNKPIN"] = bank.get("bankPin", "")
        else:
            for key in [
                "LEGALHEIR",
                "LH{suffix}FATHER",
                "LH{suffix}PAN",
                "LH{suffix}DEMAT",
                "LH{suffix}AGE",
                "LH{suffix}RELATION",
                "LH{suffix}ADDRESS",
                "LH{suffix}PIN",
                "Email",
                "Mobile",
                "SH{suffix}NAME",
                "SH{suffix}DOD",
                "LH{suffix}ACCNO",
                "LH{suffix}BNKNAME",
                "LH{suffix}BNKBRANCH",
                "LH{suffix}IFSC",
                "LH{suffix}MICR",
                "LH{suffix}BNKCITY",
                "LH{suffix}BNKPIN",
            ]:
                if "{suffix}" in key:
                    data[key.format(suffix=suffix)] = ""
                else:
                    data[f"{key}{suffix}"] = ""

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

    return data


FILE_NAME_MAPPING = {
    "auth-letter": "1. Authorization_Letter.docx",
    "request-letter": "2. Request_Letter.docx",
    "isr-1": "3. ISR1.docx",
    "sh-13": "4. SH-13.docx",
    "isr5-annexure-c": "8. ISR5-AnnexureC.docx",
    "annexure-d-heir-1": "9A. AnnexureD-Affidavit LEGAL HEIR 1.docx",
    "annexure-d-heir-2": "9A. AnnexureD-Affidavit LEGAL HEIR 2.docx",
    "annexure-d-heir-3": "9A. AnnexureD-Affidavit LEGAL HEIR 3.docx",
    "annexure-e-indemnity": "10. AnnexureE-Indemnity_from_LegalHeir.docx",
}


def transform_selected_files(selected_files: List[str]) -> List[str]:
    return [
        FILE_NAME_MAPPING[file_id]
        for file_id in selected_files
        if file_id in FILE_NAME_MAPPING
    ]
