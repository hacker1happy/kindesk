import { useState, useEffect } from "react";
import "./ShareholderForm.css";

const ShareholderForm = ({ index, data, onChange, onValidityChange }) => {
  const [errors, setErrors] = useState({});

  // =========================
  // REGEX PATTERNS
  // =========================
  const nameRegex = /^[A-Za-z ]{3,}$/;
  const mobileRegex = /^[6-9]\d{9}$/;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const pinRegex = /^\d{6}$/;
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  const accountRegex = /^\d{9,18}$/;

  // =========================
  // VALIDATION FUNCTION
  // =========================
  const validateField = (field, value) => {
    switch (field) {
      case "name":
      case "fatherName":
      case "bankName":
        return nameRegex.test(value);
      case "mobile":
        return mobileRegex.test(value);
      case "panNumber":
        return panRegex.test(value);
      case "email":
        return emailRegex.test(value);
      case "pinCode":
        return pinRegex.test(value);
      case "ifscCode":
        return ifscRegex.test(value);
      case "accountNumber":
        return accountRegex.test(value);
      default:
        return true;
    }
  };

  // =========================
  // ERROR MESSAGES
  // =========================
  const errorMessages = {
    name: "Minimum 3 letters. Alphabets only.",
    fatherName: "Minimum 3 letters. Alphabets only.",
    bankName: "Minimum 3 letters. Alphabets only.",
    mobile: "Enter valid 10 digit mobile starting with 6-9.",
    panNumber: "Invalid PAN format (ABCDE1234F).",
    email: "Enter valid email address.",
    pinCode: "PIN must be exactly 6 digits.",
    ifscCode: "Invalid IFSC format.",
    accountNumber: "Account number must be 9-18 digits.",
  };

  // =========================
  // HANDLE CHANGE
  // =========================
  const handleChange = (section, field, value) => {
    let formattedValue = value;

    if (["name", "fatherName", "bankName"].includes(field)) {
      formattedValue = value.replace(/[^A-Za-z ]/g, "");
    }

    if (field === "mobile") {
      formattedValue = value.replace(/\D/g, "").slice(0, 10);
    }

    if (field === "pinCode") {
      formattedValue = value.replace(/\D/g, "").slice(0, 6);
    }

    if (field === "accountNumber") {
      formattedValue = value.replace(/\D/g, "").slice(0, 18);
    }

    if (field === "panNumber") {
      formattedValue = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10);
    }

    if (field === "ifscCode") {
      formattedValue = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 11);
    }

    const isValid = validateField(field, formattedValue);

    setErrors((prev) => ({
      ...prev,
      [field]: formattedValue && !isValid,
    }));

    onChange(index, section, field, formattedValue);
  };

  const getInputClass = (field, value) => {
    if (!value) return "";
    return validateField(field, value)
      ? "valid-input"
      : "invalid-input";
  };

  const renderError = (field, value) => {
    if (!value) return null;
    if (validateField(field, value)) return null;
    return <span className="error-text">{errorMessages[field]}</span>;
  };

  const isShareholderValid = () => {
  const requiredFields = [
    { key: "name", value: data.personalDetails?.name },
    { key: "fatherName", value: data.personalDetails?.fatherName },
    { key: "panNumber", value: data.personalDetails?.panNumber },
    { key: "mobile", value: data.contactDetails?.mobile },
    { key: "email", value: data.contactDetails?.email },
    { key: "pinCode", value: data.contactDetails?.pinCode },
    { key: "accountNumber", value: data.bankDetails?.accountNumber },
    { key: "ifscCode", value: data.bankDetails?.ifscCode },
    { key: "bankName", value: data.bankDetails?.bankName },
  ];

  return requiredFields.every(
    ({ key, value }) => value && validateField(key, value)
  );
};

  useEffect(() => {
  if (typeof onValidityChange === "function") {
    onValidityChange(index, isShareholderValid());
  }
  }, [data]);

  return (
    <div className="shareholder-section">
      <h3>Shareholder {index + 1} Information</h3>

      <div className="shareholder-table">
        <div className="shareholder-row header">
          <div className="header-cell">Personal details</div>
          <div className="header-cell">Contact details</div>
          <div className="header-cell">Bank details</div>
        </div>

        {/* ROW 1 */}
        <div className="shareholder-row">
          <div className="form-cell">
            <label>Name</label>
            <input
              type="text"
              value={data.personalDetails?.name || ""}
              onChange={(e) =>
                handleChange("personalDetails", "name", e.target.value)
              }
              className={getInputClass("name", data.personalDetails?.name)}
            />
            {renderError("name", data.personalDetails?.name)}
          </div>

          <div className="form-cell">
            <label>Address</label>
            <input
              type="text"
              value={data.contactDetails?.address || ""}
              onChange={(e) =>
                handleChange("contactDetails", "address", e.target.value)
              }
            />
          </div>

          <div className="form-cell">
            <label>Account number</label>
            <input
              type="text"
              value={data.bankDetails?.accountNumber || ""}
              onChange={(e) =>
                handleChange("bankDetails", "accountNumber", e.target.value)
              }
              className={getInputClass(
                "accountNumber",
                data.bankDetails?.accountNumber
              )}
            />
            {renderError("accountNumber", data.bankDetails?.accountNumber)}
          </div>
        </div>

        {/* ROW 2 */}
        <div className="shareholder-row">
          <div className="form-cell">
            <label>Father's name</label>
            <input
              type="text"
              value={data.personalDetails?.fatherName || ""}
              onChange={(e) =>
                handleChange("personalDetails", "fatherName", e.target.value)
              }
              className={getInputClass(
                "fatherName",
                data.personalDetails?.fatherName
              )}
            />
            {renderError("fatherName", data.personalDetails?.fatherName)}
          </div>

          <div className="form-cell">
            <label>Pin code</label>
            <input
              type="text"
              value={data.contactDetails?.pinCode || ""}
              onChange={(e) =>
                handleChange("contactDetails", "pinCode", e.target.value)
              }
              className={getInputClass(
                "pinCode",
                data.contactDetails?.pinCode
              )}
            />
            {renderError("pinCode", data.contactDetails?.pinCode)}
          </div>

          <div className="form-cell">
            <label>Bank Name</label>
            <input
              type="text"
              value={data.bankDetails?.bankName || ""}
              onChange={(e) =>
                handleChange("bankDetails", "bankName", e.target.value)
              }
              className={getInputClass("bankName", data.bankDetails?.bankName)}
            />
            {renderError("bankName", data.bankDetails?.bankName)}
          </div>
        </div>

        {/* ROW 3 */}
        <div className="shareholder-row">
          <div className="form-cell">
            <label>PAN card number</label>
            <input
              type="text"
              value={data.personalDetails?.panNumber || ""}
              onChange={(e) =>
                handleChange("personalDetails", "panNumber", e.target.value)
              }
              className={getInputClass(
                "panNumber",
                data.personalDetails?.panNumber
              )}
            />
            {renderError("panNumber", data.personalDetails?.panNumber)}
          </div>

          <div className="form-cell">
            <label>Mobile number</label>
            <input
              type="tel"
              value={data.contactDetails?.mobile || ""}
              onChange={(e) =>
                handleChange("contactDetails", "mobile", e.target.value)
              }
              className={getInputClass(
                "mobile",
                data.contactDetails?.mobile
              )}
            />
            {renderError("mobile", data.contactDetails?.mobile)}
          </div>

          <div className="form-cell">
            <label>Branch</label>
            <input
              type="text"
              value={data.bankDetails?.branch || ""}
              onChange={(e) =>
                handleChange("bankDetails", "branch", e.target.value)
              }
            />
          </div>
        </div>

        {/* ROW 4 */}
        <div className="shareholder-row">
          <div className="form-cell">
            <label>Demat account</label>
            <input
              type="text"
              value={data.personalDetails?.dematAccount || ""}
              onChange={(e) =>
                handleChange("personalDetails", "dematAccount", e.target.value)
              }
            />
          </div>

          <div className="form-cell">
            <label>Email address</label>
            <input
              type="email"
              value={data.contactDetails?.email || ""}
              onChange={(e) =>
                handleChange("contactDetails", "email", e.target.value)
              }
              className={getInputClass(
                "email",
                data.contactDetails?.email
              )}
            />
            {renderError("email", data.contactDetails?.email)}
          </div>

          <div className="form-cell">
            <label>IFSC code</label>
            <input
              type="text"
              value={data.bankDetails?.ifscCode || ""}
              onChange={(e) =>
                handleChange("bankDetails", "ifscCode", e.target.value)
              }
              className={getInputClass(
                "ifscCode",
                data.bankDetails?.ifscCode
              )}
            />
            {renderError("ifscCode", data.bankDetails?.ifscCode)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareholderForm;