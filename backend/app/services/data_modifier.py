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

def concat_keys(keys, data):
    data_value = [data.get(key, "") for key in keys if data.get(key, "")]

    return join_values(data_value)

def claimant_keys(key_builder, data):
    return [key_builder(suffix) for suffix in data.get("_CLAIMANT_SUFFIXES", ["A", "B", "C"])]

def concat_shareholder_died_on(data):
    values = []
    for suffix in ["A", "B", "C"]:
        name = data.get(f"SH{suffix}NAME", "")
        dod = data.get(f"SH{suffix}DOD", "")
        if name and dod:
            values.append(f"{name} died on {dod}")
        elif name:
            values.append(name)

    return join_values(values)

def join_values(data_value):
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
    data["LHNAMES"] = concat_keys(claimant_keys(lambda suffix: f"LEGALHEIR{suffix}", data), data)
    data["LHFATHERNAMES"] = concat_keys(claimant_keys(lambda suffix: f"LH{suffix}FATHER", data), data)
    data["LHADDRESSES"] = concat_keys(claimant_keys(lambda suffix: f"LH{suffix}ADDRESS", data), data)
    data["EMAILADDRESSES"] = concat_keys(claimant_keys(lambda suffix: f"Email{suffix}", data), data)
    data["MOBILENUMBERS"] = concat_keys(claimant_keys(lambda suffix: f"Mobile{suffix}", data), data)
    data["SHNAMES"] = concat_keys(["SHANAME", "SHBNAME", "SHCNAME"], data)
    data["SHAREHOLDERDOD"] = concat_keys(["SHADOD", "SHBDOD", "SHCDOD"], data)
    data["SHNAMEDIEDONSHDOD"] = concat_shareholder_died_on(data)
    data["REQUESTLETTERSUBJECT"] = "Transmission of Shares in the name of Legal Heir"
    return data

def both_process(data):
    data = transmission(data)
    data["REQUESTLETTERSUBJECT"] = "Issuance of Duplicate Shares and Transmission of Shares in the name of Legal Heir"
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
