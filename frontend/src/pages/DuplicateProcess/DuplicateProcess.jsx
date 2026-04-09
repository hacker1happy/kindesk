import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useFormSubmit } from '../../hooks/useFormSubmit';
import { saveFormData, getFormData } from '../../api/formApi';
import ShareholderForm from './components/ShareholderForm';
import SecuritiesTable from './components/SecuritiesTable';
import CompanyInfo from './components/CompanyInfo';
import RTAInfo from './components/RTAInfo';
import DocumentList from './components/DocumentList';
import OtherInfo from './components/OtherInfo';
import './styles/DuplicateProcess.css';
import './styles/components.css';
import './styles/global.css';


const DuplicateProcess = () => {
  const { clientId, caseId } = useParams();

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
          const data = res.data.formData;

          setShareholders(data.shareholders || []);
          setSecurities(data.securities || []);
          setCompanyInfo(data.companyInfo || {});
          setRtaInfo(data.rtaInfo || {});
          setDocuments(data.documents || []);
          setOtherInfo(data.otherInfo || {});
        })
        .catch(() => console.log("No existing form found"));
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

  // Handle company info changes
  const handleCompanyInfoChange = (field, value) => {
    setCompanyInfo({
      ...companyInfo,
      [field]: value
    });
  };

  // Handle RTA info changes
  const handleRTAInfoChange = (field, value) => {
    setRtaInfo({
      ...rtaInfo,
      [field]: value
    });
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

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedDocuments = documents
      .filter(doc => doc.selected)
      .map(doc => doc.id);

    const formData = {
      shareholders: shareholders,
      securities: securities,
      companyInfo: companyInfo,
      rtaInfo: rtaInfo,
      documents: documents,
      otherInfo: otherInfo,
      totalShares: calculateTotalShares()
    };

    try {
      // ✅ Step 1: Save Form
      await saveFormData(clientId, caseId, formData);

      // ✅ Step 2: Generate Documents
      await submitForm(clientId, caseId, formData, selectedDocuments);

      alert('Documents generated successfully!');

      // ✅ Step 3: Redirect to Case Details
      navigate(`/clients/${clientId}/cases/${caseId}`);

    } catch (err) {
      alert('Failed to generate documents.');
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
    setCompanyInfo({ name: '', address: '' });
    setRtaInfo({ name: '', address: '' });
    setDocuments(documents.map(doc => ({ ...doc, selected: false, required: false })));
    setOtherInfo({ formDate: '', folioNumber: '', faceValue: '' });
  };

  return (
    <div className="duplicate-process">
      <div className="container">
        <div className="form-container">
          <h1>Duplicate Process</h1>

          {/* Number of Shareholders Selector */}
          <div className="form-section">
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
            <OtherInfo data={otherInfo} onChange={handleOtherInfoChange} />

            {/* Securities Information */}
            <SecuritiesTable
              securities={securities}
              onAdd={handleAddSecurity}
              onRemove={handleRemoveSecurity}
              onChange={handleSecurityChange}
              totalShares={calculateTotalShares()}
            />

            {/* Company Information */}
            <CompanyInfo
              data={companyInfo}
              onChange={handleCompanyInfoChange}
            />

            {/* RTA Information */}
            <RTAInfo
              data={rtaInfo}
              onChange={handleRTAInfoChange}
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
                disabled={loading || !isFormValid}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Generating...
                  </>
                ) : "Submit"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={async () => {
                  const formData = {
                    shareholders,
                    securities,
                    companyInfo,
                    rtaInfo,
                    documents,
                    otherInfo,
                    totalShares: calculateTotalShares()
                  };

                  await saveFormData(clientId, caseId, formData);

                  alert("Saved successfully!");
                }}
              >
                Save Draft
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleReset}>
                Reset
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                Back to Home
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DuplicateProcess;