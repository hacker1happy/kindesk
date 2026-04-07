# backend/app/services/data_modifier.py

concat_keywords = {
    "SIGNATURE": "Shareholder name(s)",
    "Email": "Email address(s)",
    "Mobile": "Mobile number(s)",
    "LEGALHEIR": "Legal heir names(s)",
    "FATHER": "Legal heir father-names(s)",
    "LH_ADDRESS": "Legal heir address(s)",
    "SH_NAME": "Shareholder name(s)",
    "DOD": "Shareholder date of demise(s)",
}

def concat_helper(keyword, data):
    data_value = [data[key] for key in data if keyword in key and len(data[key]) > 0]

    values = len(data_value)
    if values == 1:
        return data_value[0]
    elif values == 2:
        return " & ".join(data_value)
    elif values >= 3:
        return ", ".join(data_value[:-1]) + " & " + data_value[-1]
    else:
        return ""

def add_static_value(data):
    suffixes = ["A", "B", "C", "D"]
    for suffix in suffixes:
        certno_key = "CERTNO" + suffix
        nos_key = "NOS" + suffix
        if certno_key in data and data[certno_key] != "":
            data["STATICVALUE" + suffix] = (
                data.get(nos_key, "") + " with " + data.get("FACEVALUE", "") + " face value"
            )
        else:
            data["STATICVALUE" + suffix] = ""
    return data

def duplicate(data):
    data["SHAREHOLDERNAME"] = concat_helper("SIGNATURE", data)
    data["EMAILADDRESS"] = concat_helper("Email", data)
    data["SHAREHOLDERMOBILE"] = concat_helper("Mobile", data)
    return add_static_value(data)

def transmission(data):
    data["LHNAMES"] = concat_helper("LEGALHEIR", data)
    data["LHFATHERNAMES"] = concat_helper("FATHER", data)
    data["LHADDRESSES"] = concat_helper("LH_ADDRESS", data)
    data["EMAILADDRESSES"] = concat_helper("Email", data)
    data["MOBILENUMBERS"] = concat_helper("Mobile", data)
    data["SHNAMES"] = concat_helper("SH_NAME", data)
    data["SHAREHOLDERDOD"] = concat_helper("DOD", data)
    return data

def both_process(data):
    data = transmission(data)
    return add_static_value(data)

def modify_data(data, process):
    process = process.upper()

    if process == "DUPLICATE":
        return duplicate(data)
    elif process == "TRANSMISSION":
        return transmission(data)
    elif process == "BOTH":
        return both_process(data)

    return data