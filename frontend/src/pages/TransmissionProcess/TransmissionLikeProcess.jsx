import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCaseDetails } from "../../api/caseApi";
import { getCompanyById } from "../../api/companyApi";
import { getFormData, saveFormData } from "../../api/formApi";
import ConfirmationModal from "../../components/ConfirmationModal";
import FeedbackDialog from "../../components/FeedbackDialog";
import { useFormSubmit } from "../../hooks/useFormSubmit";
import DocumentList from "../DuplicateProcess/components/DocumentList";
import SecuritiesTable from "../DuplicateProcess/components/SecuritiesTable";
import {
  DEFAULT_LEGAL_HEIR,
  DEFAULT_SECURITY,
  DEFAULT_SHAREHOLDER,
} from "./processConfig";
import "../DuplicateProcess/components/OtherInfo.css";
import "../DuplicateProcess/components/ShareholderForm.css";
import "../DuplicateProcess/styles/DuplicateProcess.css";

const LEGAL_HEIR_VALIDATORS = {
  name: (value) => /^[A-Za-z ]{3,}$/.test(value),
  fatherName: (value) => /^[A-Za-z ]{3,}$/.test(value),
  panNumber: (value) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value),
  mobile: (value) => /^[6-9]\d{9}$/.test(value),
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  pinCode: (value) => /^\d{6}$/.test(value),
  accountNumber: (value) => /^\d{9,18}$/.test(value),
  ifscCode: (value) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value),
  bankName: (value) => /^[A-Za-z ]{3,}$/.test(value),
};

const LEGAL_HEIR_REQUIRED_FIELDS = [
  ["personalDetails", "name"],
  ["personalDetails", "fatherName"],
  ["personalDetails", "panNumber"],
  ["contactDetails", "mobile"],
  ["contactDetails", "email"],
  ["contactDetails", "pinCode"],
  ["bankDetails", "accountNumber"],
  ["bankDetails", "ifscCode"],
  ["bankDetails", "bankName"],
];

const LEGAL_HEIR_REQUIRED_FIELD_KEYS = new Set(
  LEGAL_HEIR_REQUIRED_FIELDS.map(([, field]) => field)
);

function normalizeLoadedFormData(data) {
  const normalizedShareholders = data.shareholders?.length
    ? data.shareholders
    : data.legalHeirs
      ?.map((heir) => heir.deceasedShareholder)
      .filter((shareholder) => shareholder && Object.values(shareholder).some(Boolean));

  return {
    legalHeirs: data.legalHeirs?.map((heir) => {
      const nextHeir = { ...heir };
      delete nextHeir.deceasedShareholder;
      return nextHeir;
    }) || [],
    shareholders: normalizedShareholders?.length ? normalizedShareholders : [{ ...DEFAULT_SHAREHOLDER }],
    securities: data.securities || [],
    companyInfo: data.companyInfo,
    rtaInfo: data.rtaInfo,
    documents: data.documents,
    otherInfo: data.otherInfo,
  };
}

export default function TransmissionLikeProcess({
  processName,
  title,
  documents: processDocuments,
  draftLabel,
  successMessage,
}) {
  const { clientId, caseId } = useParams();
  const navigate = useNavigate();
  const { submitForm, loading, error } = useFormSubmit(processName);

  const [isEditMode, setIsEditMode] = useState(false);
  const [caseContext, setCaseContext] = useState(null);
  const [documentsReadyForGeneration, setDocumentsReadyForGeneration] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [numLegalHeirs, setNumLegalHeirs] = useState(1);
  const [legalHeirs, setLegalHeirs] = useState([{ ...DEFAULT_LEGAL_HEIR }]);
  const [numShareholders, setNumShareholders] = useState(1);
  const [shareholders, setShareholders] = useState([{ ...DEFAULT_SHAREHOLDER }]);
  const [validityMap, setValidityMap] = useState({});
  const [securities, setSecurities] = useState([{ ...DEFAULT_SECURITY }]);
  const [companyInfo, setCompanyInfo] = useState({ name: "", address: "" });
  const [rtaInfo, setRtaInfo] = useState({ name: "", address: "" });
  const [documents, setDocuments] = useState(processDocuments);
  const [otherInfo, setOtherInfo] = useState({
    formDate: "",
    folioNumber: "",
    faceValue: "",
  });

  const visibleDocuments = useMemo(
    () => documents.filter((doc) => !doc.heirIndex || doc.heirIndex <= numLegalHeirs),
    [documents, numLegalHeirs]
  );

  const mergeSavedDocuments = useCallback((savedDocuments = []) => {
    return processDocuments.map((doc) => {
      const saved = savedDocuments.find((item) => item.id === doc.id);
      return saved ? { ...doc, selected: Boolean(saved.selected) } : doc;
    });
  }, [processDocuments]);

  const loadCaseDefaults = useCallback(async () => {
    try {
      const caseRes = await getCaseDetails(clientId, caseId);
      const caseData = caseRes.data.case;
      const requiredStagesCompleted = ["mail_sent", "case_docs_received"].every((stageKey) =>
        caseData.stages?.some((stage) => stage.key === stageKey && stage.completed)
      );
      const companyRes = await getCompanyById(caseData.company_id);
      const company = companyRes.data;
      const context = {
        folioNumber: caseData.folio_number || "",
        companyName: company.company_name || "",
        companyAddress: company.company_address || "",
        rtaName: company.rta_name || "",
        rtaAddress: company.rta_address || "",
      };

      setCaseContext(context);
      setDocumentsReadyForGeneration(requiredStagesCompleted);
      setCompanyInfo({ name: context.companyName, address: context.companyAddress });
      setRtaInfo({ name: context.rtaName, address: context.rtaAddress });
      setOtherInfo((prev) => ({
        ...prev,
        folioNumber: context.folioNumber || prev.folioNumber,
      }));
    } catch (err) {
      console.error("Failed to load selected company details", err);
    }
  }, [caseId, clientId]);

  useEffect(() => {
    if (!clientId || !caseId) return;

    getFormData(clientId, caseId)
      .then((res) => {
        const data = res.data;

        if (!Object.keys(data).length || !data.legalHeirs) {
          loadCaseDefaults();
          return;
        }

        const normalizedData = normalizeLoadedFormData(data);

        setIsEditMode(true);
        setLegalHeirs(normalizedData.legalHeirs.length ? normalizedData.legalHeirs : [{ ...DEFAULT_LEGAL_HEIR }]);
        setNumLegalHeirs(normalizedData.legalHeirs.length || 1);
        setShareholders(normalizedData.shareholders);
        setNumShareholders(normalizedData.shareholders.length || 1);
        setSecurities(normalizedData.securities.length ? normalizedData.securities : [{ ...DEFAULT_SECURITY }]);
        setCompanyInfo(normalizedData.companyInfo || { name: "", address: "" });
        setRtaInfo(normalizedData.rtaInfo || { name: "", address: "" });
        setDocuments(mergeSavedDocuments(normalizedData.documents));
        setOtherInfo(normalizedData.otherInfo || {
          formDate: "",
          folioNumber: "",
          faceValue: "",
        });
        loadCaseDefaults();
      })
      .catch(() => loadCaseDefaults());
  }, [caseId, clientId, loadCaseDefaults, mergeSavedDocuments]);

  const handleLegalHeirValidityChange = useCallback((itemIndex, isValid) => {
    setValidityMap((prev) => {
      if (prev[itemIndex] === isValid) return prev;
      return { ...prev, [itemIndex]: isValid };
    });
  }, []);

  const handleNumLegalHeirsChange = (event) => {
    const count = parseInt(event.target.value);
    const nextLegalHeirs = [...legalHeirs];

    if (count > nextLegalHeirs.length) {
      for (let i = nextLegalHeirs.length; i < count; i++) {
        nextLegalHeirs.push({ ...DEFAULT_LEGAL_HEIR });
      }
    } else {
      nextLegalHeirs.splice(count);
    }

    setNumLegalHeirs(count);
    setLegalHeirs(nextLegalHeirs);
  };

  const handleNumShareholdersChange = (event) => {
    const count = parseInt(event.target.value);
    const nextShareholders = [...shareholders];

    if (count > nextShareholders.length) {
      for (let i = nextShareholders.length; i < count; i++) {
        nextShareholders.push({ ...DEFAULT_SHAREHOLDER });
      }
    } else {
      nextShareholders.splice(count);
    }

    setNumShareholders(count);
    setShareholders(nextShareholders);
  };

  const handleLegalHeirChange = (index, section, field, value) => {
    const updatedLegalHeirs = [...legalHeirs];
    updatedLegalHeirs[index] = {
      ...updatedLegalHeirs[index],
      [section]: {
        ...updatedLegalHeirs[index][section],
        [field]: value,
      },
    };
    setLegalHeirs(updatedLegalHeirs);
  };

  const handleShareholderChange = (index, field, value) => {
    const updatedShareholders = [...shareholders];
    updatedShareholders[index] = { ...updatedShareholders[index], [field]: value };
    setShareholders(updatedShareholders);
  };

  const handleSecurityChange = (index, field, value) => {
    const updatedSecurities = [...securities];
    updatedSecurities[index] = { ...updatedSecurities[index], [field]: value };
    setSecurities(updatedSecurities);
  };

  const handleAddSecurity = () => {
    if (securities.length < 4) {
      setSecurities([...securities, { ...DEFAULT_SECURITY }]);
    }
  };

  const handleRemoveSecurity = (index) => {
    if (securities.length > 1) {
      setSecurities(securities.filter((_, itemIndex) => itemIndex !== index));
    }
  };

  const handleDocumentToggle = (index, field, value) => {
    const targetDocument = visibleDocuments[index];
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === targetDocument.id ? { ...doc, [field]: value } : doc))
    );
  };

  const handleSelectAll = () => {
    const allVisibleSelected = visibleDocuments.every((doc) => doc.selected);
    const visibleIds = new Set(visibleDocuments.map((doc) => doc.id));

    setDocuments((prev) =>
      prev.map((doc) =>
        visibleIds.has(doc.id) ? { ...doc, selected: !allVisibleSelected } : doc
      )
    );
  };

  const handleOtherInfoChange = (field, value) => {
    setOtherInfo({ ...otherInfo, [field]: value });
  };

  const calculateTotalShares = () => {
    return securities.reduce((sum, security) => sum + (parseInt(security.shares) || 0), 0);
  };

  const buildFormData = () => ({
    legalHeirs,
    shareholders,
    securities,
    companyInfo,
    rtaInfo,
    documents,
    otherInfo: {
      ...otherInfo,
      folioNumber: otherInfo.folioNumber || caseContext?.folioNumber || "",
      stateName: legalHeirs[0]?.contactDetails?.state || "",
      cityName: legalHeirs[0]?.contactDetails?.city || "",
    },
    totalShares: calculateTotalShares(),
  });

  const handleSaveDraft = async () => {
    await saveFormData(clientId, caseId, buildFormData());
    setSaveStatus("Form Saved");
    setFeedback({
      title: "Form Saved",
      message: `Your ${draftLabel} draft has been saved.`,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = buildFormData();

    try {
      if (!documentsReadyForGeneration) {
        await saveFormData(clientId, caseId, formData);
        setSaveStatus("Form Saved");
        setFeedback({
          title: "Form Saved",
          message: "Complete Mail Sent to Client and Case Docs Received before generating documents.",
          tone: "warning",
        });
        return;
      }

      setIsGenerating(true);
      await saveFormData(clientId, caseId, formData);
      await submitForm(
        clientId,
        caseId,
        formData,
        visibleDocuments.filter((doc) => doc.selected).map((doc) => doc.id)
      );

      setFeedback({
        title: "Documents Generated",
        message: successMessage,
        onClose: () => navigate(`/clients/${clientId}/cases/${caseId}?tab=documents&stage=document-upload-stage`),
      });
    } catch (err) {
      setFeedback({
        title: "Generation Failed",
        message: err.message || "Failed to generate documents.",
        tone: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setNumLegalHeirs(1);
    setLegalHeirs([{ ...DEFAULT_LEGAL_HEIR }]);
    setNumShareholders(1);
    setShareholders([{ ...DEFAULT_SHAREHOLDER }]);
    setSecurities([{ ...DEFAULT_SECURITY }]);
    setDocuments(processDocuments.map((doc) => ({ ...doc, selected: false })));
    setCompanyInfo({
      name: caseContext?.companyName || "",
      address: caseContext?.companyAddress || "",
    });
    setRtaInfo({
      name: caseContext?.rtaName || "",
      address: caseContext?.rtaAddress || "",
    });
    setOtherInfo({
      formDate: "",
      folioNumber: caseContext?.folioNumber || "",
      faceValue: "",
    });
    setShowResetConfirm(false);
  };

  const isLegalHeirInfoValid =
    legalHeirs.length > 0 &&
    legalHeirs.every((_, index) => validityMap[index] === true);
  const hasRequiredShareholderName = shareholders.some((shareholder) => shareholder.name?.trim());
  const isGenerateInProgress = loading || isGenerating;
  const isFormValid = isLegalHeirInfoValid && hasRequiredShareholderName;

  return (
    <main className="duplicate-process container">
      <button className="back-link duplicate-process-back" onClick={() => navigate(`/clients/${clientId}/cases/${caseId}`)}>
        ← Back to Case
      </button>

      <div className="duplicate-process-header">
        <div>
          <h2>{title}</h2>
        </div>
      </div>

      <section className="form-container">
        <div className="case-context-strip">
          <div>
            <span>Folio</span>
            <strong>{otherInfo.folioNumber || "-"}</strong>
          </div>
          <div>
            <span>Company</span>
            <strong>{companyInfo.name || "-"}</strong>
          </div>
          <div>
            <span>RTA</span>
            <strong>{rtaInfo.name || "-"}</strong>
          </div>
        </div>

        <div className={`generation-readiness ${documentsReadyForGeneration ? "ready" : "saved"}`}>
          <div>
            <span>
              {saveStatus ||
                (documentsReadyForGeneration
                  ? "Documents Ready for Generation"
                  : isEditMode
                    ? "Form Saved"
                    : "Form Can Be Saved")}
            </span>
            <strong>
              {documentsReadyForGeneration
                ? "Generate Documents is available."
                : "Save Draft is available now. Generate Documents unlocks after the prerequisite stages are completed."}
            </strong>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section compact-section">
            <div className="form-group shareholders-select">
              <label>Select number of legal heirs</label>
              <select value={numLegalHeirs} onChange={handleNumLegalHeirsChange}>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>
          </div>

          {legalHeirs.map((legalHeir, index) => (
            <LegalHeirForm
              key={index}
              index={index}
              data={legalHeir}
              onChange={handleLegalHeirChange}
              onValidityChange={handleLegalHeirValidityChange}
            />
          ))}

          <ShareholderInformation
            count={numShareholders}
            shareholders={shareholders}
            onCountChange={handleNumShareholdersChange}
            onChange={handleShareholderChange}
          />

          <TransmissionOtherInfo
            data={otherInfo}
            onChange={handleOtherInfoChange}
          />

          <SecuritiesTable
            securities={securities}
            onAdd={handleAddSecurity}
            onRemove={handleRemoveSecurity}
            onChange={handleSecurityChange}
            totalShares={calculateTotalShares()}
          />

          <DocumentList
            documents={visibleDocuments}
            onToggle={handleDocumentToggle}
            onSelectAll={handleSelectAll}
          />

          {error && <div className="error-message">{error}</div>}

          <div className="button-group">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isGenerateInProgress || !isFormValid || !documentsReadyForGeneration}
              title={
                !documentsReadyForGeneration
                  ? "Complete Mail Sent to Client and Case Docs Received before generating documents."
                  : ""
              }
            >
              {isGenerateInProgress ? (
                <>
                  <span className="spinner"></span>Generating...
                  {/* {isEditMode ? "Updating & Generating..." : "Generating..."} */}
                </>
              ) : (
                isEditMode ? "Update & Generate" : "Generate Documents"
              )}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleSaveDraft}>
              Save Draft
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowResetConfirm(true)}>
              Reset
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
          </div>
        </form>
      </section>
      {showResetConfirm && (
        <ConfirmationModal
          title="Reset form?"
          message="This will clear the current form entries and restore case defaults."
          detail="Saved draft data will remain unchanged until you save again."
          confirmLabel="Reset"
          danger
          onCancel={() => setShowResetConfirm(false)}
          onConfirm={handleReset}
        />
      )}
      {feedback && (
        <FeedbackDialog
          {...feedback}
          onClose={() => {
            const next = feedback.onClose;
            setFeedback(null);
            next?.();
          }}
        />
      )}
    </main>
  );
}

function ShareholderInformation({ count, shareholders, onCountChange, onChange }) {
  const toDateInputValue = (value) => {
    if (!value) return "";
    const parts = value.split("-");
    if (parts.length !== 3) return value;
    return parts[0].length === 4 ? value : parts.reverse().join("-");
  };

  const fromDateInputValue = (value) => {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    return `${day}-${month}-${year}`;
  };

  const formatName = (value) => value.replace(/[^A-Za-z ]/g, "");

  return (
    <div className="form-section shareholder-info-section">
      <div className="section-header">
        <h2>Shareholder Information</h2>
        <div className="form-group shareholders-select">
          <label>Shareholders</label>
          <select value={count} onChange={onCountChange}>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
      </div>

      <div className="securities-container">
        <table className="securities-table">
          <thead>
            <tr>
              <th>Sr No.</th>
              <th>
                Shareholder Name <span className="required-marker">*</span>
              </th>
              <th>Date of Demise</th>
            </tr>
          </thead>
          <tbody>
            {shareholders.map((shareholder, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  <input
                    type="text"
                    value={shareholder.name || ""}
                    className={index === 0 && shareholder.name ? "valid-input" : ""}
                    onChange={(event) => onChange(index, "name", formatName(event.target.value))}
                    placeholder={index === 0 ? "Required" : "Optional"}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={toDateInputValue(shareholder.dateOfDemise)}
                    onChange={(event) => onChange(index, "dateOfDemise", fromDateInputValue(event.target.value))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransmissionOtherInfo({ data, onChange }) {
  const handleDateChange = (value) => {
    if (!value) {
      onChange("formDate", "");
      return;
    }

    const [year, month, day] = value.split("-");
    onChange("formDate", `${day}-${month}-${year}`);
  };

  return (
    <div className="form-section">
      <h2>Other Important Information</h2>
      <div className="other-info-grid compact">
        <div className="other-info-item">
          <label>Form Date (DD-MM-YYYY)</label>
          <input
            type="date"
            value={data.formDate ? data.formDate.split("-").reverse().join("-") : ""}
            onChange={(event) => handleDateChange(event.target.value)}
          />
        </div>
        <div className="other-info-item">
          <label>Face Value</label>
          <input
            type="text"
            inputMode="decimal"
            value={data.faceValue || ""}
            onChange={(event) => onChange("faceValue", event.target.value.replace(/[^0-9.]/g, ""))}
          />
        </div>
      </div>
    </div>
  );
}

function LegalHeirForm({ index, data, onChange, onValidityChange }) {
  const formatValue = (field, value) => {
    if (["name", "fatherName", "bankName"].includes(field)) {
      return value.replace(/[^A-Za-z ]/g, "");
    }

    if (["mobile", "pinCode"].includes(field)) {
      return value.replace(/\D/g, "").slice(0, field === "mobile" ? 10 : 6);
    }

    if (field === "accountNumber") {
      return value.replace(/\D/g, "").slice(0, 18);
    }

    if (["panNumber", "ifscCode"].includes(field)) {
      return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, field === "panNumber" ? 10 : 11);
    }

    if (["age", "micrNumber", "bankPin"].includes(field)) {
      return value.replace(/\D/g, "");
    }

    return value;
  };

  const handleChange = (section, field, value) => {
    onChange(index, section, field, formatValue(field, value));
  };

  useEffect(() => {
    const isValid = LEGAL_HEIR_REQUIRED_FIELDS.every(([section, field]) => {
      const value = data[section]?.[field];
      return value && (!LEGAL_HEIR_VALIDATORS[field] || LEGAL_HEIR_VALIDATORS[field](value));
    });
    onValidityChange(index, isValid);
  }, [data, index, onValidityChange]);

  const inputClass = (section, field) => {
    const value = data[section]?.[field];
    if (!value || !LEGAL_HEIR_VALIDATORS[field]) return "";
    return LEGAL_HEIR_VALIDATORS[field](value) ? "valid-input" : "invalid-input";
  };

  const renderInput = (section, field, label, type = "text", options = {}) => (
    <div className="form-cell">
      <label>
        {label}
        {LEGAL_HEIR_REQUIRED_FIELD_KEYS.has(field) && <span className="required-marker"> *</span>}
      </label>
      <input
        type={type}
        value={data[section]?.[field] || ""}
        disabled={options.disabled}
        className={inputClass(section, field)}
        onChange={(event) => handleChange(section, field, event.target.value)}
      />
    </div>
  );

  const renderBankLocationInput = (field, label) => (
    <div className="split-field">
      <label>{label}</label>
      <input
        type="text"
        value={data.bankDetails?.[field] || ""}
        onChange={(event) => handleChange("bankDetails", field, event.target.value)}
      />
    </div>
  );

  return (
    <div className="shareholder-section">
      <h3>Legal Heir {index + 1}</h3>
      <div className="shareholder-table">
        <div className="shareholder-row header">
          <div className="header-cell">Personal details</div>
          <div className="header-cell">Contact details</div>
          <div className="header-cell">Bank details</div>
        </div>
        <div className="shareholder-row">
          {renderInput("personalDetails", "name", "Name")}
          {renderInput("contactDetails", "address", "Address")}
          {renderInput("bankDetails", "accountNumber", "Account number")}
        </div>
        <div className="shareholder-row">
          {renderInput("personalDetails", "fatherName", "Father's name")}
          {renderInput("contactDetails", "city", "City", "text", { disabled: index > 0 })}
          {renderInput("bankDetails", "bankName", "Bank name")}
        </div>
        <div className="shareholder-row">
          {renderInput("personalDetails", "age", "Age")}
          {renderInput("contactDetails", "state", "State", "text", { disabled: index > 0 })}
          {renderInput("bankDetails", "branch", "Branch")}
        </div>
        <div className="shareholder-row">
          {renderInput("personalDetails", "relation", "Relation with shareholder")}
          {renderInput("contactDetails", "pinCode", "Pin code")}
          {renderInput("bankDetails", "ifscCode", "IFSC code")}
        </div>
        <div className="shareholder-row">
          {renderInput("personalDetails", "panNumber", "PAN card number")}
          {renderInput("contactDetails", "mobile", "Mobile number", "tel")}
          <div className="form-cell split-field-cell">
            {renderBankLocationInput("bankCity", "Bank city")}
            {renderBankLocationInput("bankPin", "Bank PIN code")}
          </div>
        </div>
        <div className="shareholder-row">
          {renderInput("personalDetails", "dematAccount", "Demat account")}
          {renderInput("contactDetails", "email", "Email address", "email")}
          {renderInput("bankDetails", "micrNumber", "MICR number")}
        </div>
      </div>
    </div>
  );
}
