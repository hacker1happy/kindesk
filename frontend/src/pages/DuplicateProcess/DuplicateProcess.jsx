import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import { saveFormData, getFormData } from '../../api/formApi';
import { getCaseDetails } from '../../api/caseApi';
import { getCompanyById } from '../../api/companyApi';
import ConfirmationModal from '../../components/ConfirmationModal';
import FeedbackDialog from '../../components/FeedbackDialog';
import ShareholderForm from './components/ShareholderForm';
import SecuritiesTable from './components/SecuritiesTable';
import DocumentList from './components/DocumentList';
import OtherInfo from './components/OtherInfo';
import './styles/DuplicateProcess.css';


const DuplicateProcess = () => {
  const { clientId, caseId } = useParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [caseContext, setCaseContext] = useState(null);
  const [documentsReadyForGeneration, setDocumentsReadyForGeneration] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const { submitForm, loading, error } = useFormSubmit('duplicate');

  // State for number of shareholders
  const [numShareholders, setNumShareholders] = useState(1);
  const [shareholders, setShareholders] = useState([
    { personalDetails: {}, contactDetails: {}, bankDetails: {} }
  ]);
  const [validityMap, setValidityMap] = useState({});
  const handleValidityChange = (index, isValid) => {
    setValidityMap((prev) => ({
      ...prev,
      [index]: isValid,
    }));
  };

  useEffect(() => {
    // Ensure validityMap has an entry for each shareholder
    setValidityMap((prev) => {
      const updated = {};
      shareholders.forEach((_, index) => {
        updated[index] = prev[index] || false;
      });
      return updated;
    });
  }, [shareholders]);

  useEffect(() => {
    if (clientId && caseId) {
      getFormData(clientId, caseId)
        .then(res => {
          const data = res.data;
          // check if data is not empty, if empty then it means no existing form data found, so we should not set edit mode to true and just return
          if (Object.keys(data).length === 0) {
            loadCaseCompanyDefaults();
            return;
          }

          setIsEditMode(true);
          const normalizedData = normalizeLoadedFormData(data);

          setShareholders(normalizedData.shareholders?.length ? normalizedData.shareholders : [
            { personalDetails: {}, contactDetails: {}, bankDetails: {} }
          ]);

          setNumShareholders(normalizedData.shareholders?.length || 1);

          setSecurities(normalizedData.securities?.length ? normalizedData.securities : [
            { certificateNumber: '', distinctiveFrom: '', distinctiveTo: '', shares: '' }
          ]);

          setCompanyInfo(normalizedData.companyInfo || { name: '', address: '' });
          setRtaInfo(normalizedData.rtaInfo || { name: '', address: '' });

          setDocuments(normalizedData.documents?.length ? normalizedData.documents : documents);

          setOtherInfo(normalizedData.otherInfo || {
            formDate: '',
            folioNumber: '',
            faceValue: ''
          });

          loadCaseCompanyDefaults();
        })
        .catch(() => {
          console.log("No existing form found");
          loadCaseCompanyDefaults();
        });
    }
  }, [clientId, caseId]);

  // State for securities
  const [securities, setSecurities] = useState([
    { certificateNumber: '', distinctiveFrom: '', distinctiveTo: '', shares: '' }
  ]);

  // State for company information
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    address: ''
  });

  // State for RTA information
  const [rtaInfo, setRtaInfo] = useState({
    name: '',
    address: ''
  });

  // State for document list
  const [documents, setDocuments] = useState([
    { id: 'auth-letter', name: 'Authentication Letter', required: false, selected: false },
    { id: 'request-letter', name: 'Request Letter', required: false, selected: false },
    { id: 'isr-1', name: 'ISR 1', required: false, selected: false },
    { id: 'sh-13', name: 'SH - 13', required: false, selected: false },
    { id: 'isr-4', name: 'ISR 4', required: false, selected: false },
    { id: 'form-a', name: 'Form A', required: false, selected: false },
    { id: 'form-b-indemnity', name: 'Form B Indemnity', required: false, selected: false }
  ]);

  // State for other information
  const [otherInfo, setOtherInfo] = useState({
    formDate: '',
    folioNumber: '',
    faceValue: ''
  });

  const normalizeLoadedFormData = (data) => {
    if (data.shareholders || data.securities || data.companyInfo || data.rtaInfo || data.otherInfo) {
      return data;
    }

    const shareholderCount = Number(data.NumberOfShareHolders || 1);
    const shareholders = ["A", "B", "C"].slice(0, shareholderCount).map((suffix) => ({
      personalDetails: {
        name: data[`SIGNATURE${suffix}`] || "",
        fatherName: data[`SHAREHOLDER${suffix}FATHER`] || "",
        panNumber: data[`SHAREHOLDER${suffix}PAN`] || "",
        dematAccount: suffix === "A" ? data.SHAREHOLDERDEMATACCOUNT || "" : "",
      },
      contactDetails: {
        address: data[`SHAREHOLDER${suffix}ADDRESS`] || "",
        pinCode: data[`SHAREHOLDER${suffix}PINCODE`] || "",
        email: data[`Email${suffix}`] || "",
        mobile: data[`Mobile${suffix}`] || "",
      },
      bankDetails: {
        accountNumber: data[`${suffix}ACCNO`] || "",
        bankName: data[`${suffix}BNKNAME`] || "",
        branch: data[`${suffix}BRANCHNAME`] || "",
        ifscCode: data[`${suffix}IFSCODE`] || "",
      }
    }));

    const securities = ["A", "B", "C", "D"]
      .map((suffix) => ({
        certificateNumber: data[`CERTNO${suffix}`] || "",
        distinctiveFrom: data[`DISTNOFROM${suffix}`] || "",
        distinctiveTo: data[`DISTNOTO${suffix}`] || "",
        shares: data[`NOS${suffix}`] || "",
      }))
      .filter((security, index) => index === 0 || Object.values(security).some(Boolean));

    return {
      shareholders,
      securities,
      companyInfo: {
        name: data.NAMEOFTHECOMPANY || "",
        address: data.ADDRESSOFTHECOMPANY || "",
      },
      rtaInfo: {
        name: data.NAMEOFTHEREGISTRAR || "",
        address: data.ADDRESSOFTHEREGISTRAR || "",
      },
      documents,
      otherInfo: {
        formDate: data.FORMDATE || "",
        folioNumber: data.FOLIONO || "",
        faceValue: data.FACEVALUE || "",
      },
      totalShares: data.NUMBEROFSHARES || "",
    };
  };

  const loadCaseCompanyDefaults = async () => {
    try {
      const caseRes = await getCaseDetails(clientId, caseId);
      const caseData = caseRes.data.case;
      const requiredStagesCompleted = ["mail_sent", "case_docs_received"].every((stageKey) =>
        caseData.stages?.some((stage) => stage.key === stageKey && stage.completed)
      );
      const companyRes = await getCompanyById(caseData.company_id);
      const company = companyRes.data;
      const context = {
        folioNumber: caseData.folio_number || '',
        companyName: company.company_name || '',
        companyAddress: company.company_address || '',
        rtaName: company.rta_name || '',
        rtaAddress: company.rta_address || ''
      };

      setCaseContext(context);
      setDocumentsReadyForGeneration(requiredStagesCompleted);

      setCompanyInfo({
        name: context.companyName,
        address: context.companyAddress
      });

      setRtaInfo({
        name: context.rtaName,
        address: context.rtaAddress
      });

      setOtherInfo((prev) => ({
        ...prev,
        folioNumber: context.folioNumber || prev.folioNumber
      }));
    } catch (err) {
      console.error("Failed to load selected company details", err);
    }
  };

  // Handle number of shareholders change
  const handleNumShareholdersChange = (e) => {
    const num = parseInt(e.target.value);
    setNumShareholders(num);

    const newShareholders = [...shareholders];
    if (num > shareholders.length) {
      for (let i = shareholders.length; i < num; i++) {
        newShareholders.push({ personalDetails: {}, contactDetails: {}, bankDetails: {} });
      }
    } else {
      newShareholders.splice(num);
    }
    setShareholders(newShareholders);
  };

  // Handle shareholder changes
  const handleShareholderChange = (index, section, field, value) => {
    const updatedShareholders = [...shareholders];
    updatedShareholders[index] = {
      ...updatedShareholders[index],
      [section]: {
        ...updatedShareholders[index][section],
        [field]: value
      }
    };
    setShareholders(updatedShareholders);
  };

  // Handle security changes
  const handleAddSecurity = () => {
    if (securities.length < 4) {
      setSecurities([
        ...securities,
        { certificateNumber: '', distinctiveFrom: '', distinctiveTo: '', shares: '' }
      ]);
    }
  };

  const handleRemoveSecurity = (index) => {
    if (securities.length > 1) {
      const updatedSecurities = securities.filter((_, i) => i !== index);
      setSecurities(updatedSecurities);
    }
  };

  const handleSecurityChange = (index, field, value) => {
    const updatedSecurities = [...securities];
    updatedSecurities[index] = {
      ...updatedSecurities[index],
      [field]: value
    };
    setSecurities(updatedSecurities);
  };

  // Handle document toggles
  const handleDocumentToggle = (index, field, value) => {
    const updatedDocuments = [...documents];
    updatedDocuments[index] = {
      ...updatedDocuments[index],
      [field]: value
    };
    setDocuments(updatedDocuments);
  };

  const handleSelectAll = () => {
    const allSelected = documents.every(doc => doc.selected);
    const updatedDocuments = documents.map(doc => ({
      ...doc,
      selected: !allSelected
    }));
    setDocuments(updatedDocuments);
  };

  // Handle other info changes
  const handleOtherInfoChange = (field, value) => {
    setOtherInfo({
      ...otherInfo,
      [field]: value
    });
  };

  // Calculate total shares
  const calculateTotalShares = () => {
    return securities.reduce((sum, security) => sum + (parseInt(security.shares) || 0), 0);
  };

  const buildFormData = () => ({
    shareholders,
    securities,
    companyInfo,
    rtaInfo,
    documents,
    otherInfo,
    totalShares: calculateTotalShares()
  });

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedDocuments = documents
      .filter(doc => doc.selected)
      .map(doc => doc.id);

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

      // ✅ Step 1: Save Form
      await saveFormData(clientId, caseId, formData);

      // ✅ Step 2: Generate Documents
      await submitForm(clientId, caseId, formData, selectedDocuments);

      setFeedback({
        title: "Documents Generated",
        message: "The selected duplicate process documents were generated successfully.",
        onClose: () => navigate(`/clients/${clientId}/cases/${caseId}?tab=documents&stage=doc_generated`),
      });

      // ✅ Step 3: Redirect to Case Details

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

  const isFormValid =
    shareholders.length > 0 &&
    shareholders.every((_, index) => validityMap[index] === true);

  // Handle reset
  const handleReset = () => {
    setNumShareholders(1);
    setShareholders([{ personalDetails: {}, contactDetails: {}, bankDetails: {} }]);
    setSecurities([{ certificateNumber: '', distinctiveFrom: '', distinctiveTo: '', shares: '' }]);
    setCompanyInfo({
      name: caseContext?.companyName || '',
      address: caseContext?.companyAddress || ''
    });
    setRtaInfo({
      name: caseContext?.rtaName || '',
      address: caseContext?.rtaAddress || ''
    });
    setDocuments(documents.map(doc => ({ ...doc, selected: false, required: false })));
    setOtherInfo({ formDate: '', folioNumber: caseContext?.folioNumber || '', faceValue: '' });
    setShowResetConfirm(false);
  };

  const isGenerateInProgress = loading || isGenerating;

  return (
    <main className="duplicate-process container">
      <button className="back-link duplicate-process-back" onClick={() => navigate(`/clients/${clientId}/cases/${caseId}`)}>
        ← Back to Case
      </button>

      <div className="duplicate-process-header">
        <div>
          <h2>Duplicate Process</h2>
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

          {/* Number of Shareholders Selector */}
          <div className="form-section compact-section">
            <div className="form-group shareholders-select">
              <label>Select the number of shareholders</label>
              <select value={numShareholders} onChange={handleNumShareholdersChange}>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Shareholder Forms */}
            {shareholders.map((shareholder, index) => (
              <ShareholderForm
                key={index}
                index={index}
                data={shareholder}
                onChange={handleShareholderChange}
                onValidityChange={handleValidityChange}
              />
            ))}

            {/* Other Important Information */}
            <OtherInfo data={otherInfo} onChange={handleOtherInfoChange} hideFolioNumber />

            {/* Securities Information */}
            <SecuritiesTable
              securities={securities}
              onAdd={handleAddSecurity}
              onRemove={handleRemoveSecurity}
              onChange={handleSecurityChange}
              totalShares={calculateTotalShares()}
            />

            {/* Document List */}
            <DocumentList
              documents={documents}
              onToggle={handleDocumentToggle}
              onSelectAll={handleSelectAll}
            />

            {error && <div className="error-message">{error}</div>}

            {/* Submit and Reset Buttons */}
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
              <button
                type="button"
                className="btn btn-secondary"
                onClick={async () => {
                  const formData = buildFormData();

                  await saveFormData(clientId, caseId, formData);
                  setSaveStatus("Form Saved");

                  setFeedback({
                    title: "Form Saved",
                    message: "Your duplicate process draft has been saved.",
                  });
                }}
              >
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
};

export default DuplicateProcess;
