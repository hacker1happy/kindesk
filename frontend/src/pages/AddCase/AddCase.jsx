import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";
import { createCase } from "../../api/caseApi";
import { fetchCompanies } from "../../api/companyApi";
import "./AddCase.css";

const CASE_TYPES = ["Duplicate", "Transmission", "Joint"];

export default function AddCase() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [folioNumber, setFolioNumber] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companyLabel, setCompanyLabel] = useState("");
  const [caseType, setCaseType] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadCompanyOptions = async (inputValue) => {
    try {
      const res = await fetchCompanies(inputValue);

      return res.data.map((company) => ({
        value: company.company_id,
        label: company.company_name,
      }));
    } catch (err) {
      console.error("Error loading companies", err);
      return [];
    }
  };

  const handleContinue = async () => {
    if (!folioNumber || !companyId || !caseType) {
      alert("All fields required");
      return;
    }

    try {
      setLoading(true);
      const res = await createCase(clientId, {
        folio_number: folioNumber,
        company_id: companyId,
        case_type: caseType.toLowerCase(),
      });

      const caseId = res.data.case_id;

      navigate(`/clients/${clientId}/cases/${caseId}/${caseType.toLowerCase()}`);
    } catch (err) {
      console.error(err);
      alert("Error creating case");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container add-case-page">
      <button className="back-link add-case-back" onClick={() => navigate(-1)}>
        ← Back to Client 
      </button>

      <div className="add-case-header">
        <div>
          <p className="add-case-kicker">Client {clientId}</p>
          <h2>Add New Case</h2>
        </div>
      </div>

      <section className="add-case-panel">
        <div className="add-case-section-title">
          <h3>Case Information</h3>
          <span className="badge">New case</span>
        </div>

        <div className="add-case-form">
          <label className="field-group">
            <span>Folio Number</span>
            <input
              type="text"
              placeholder="Enter folio number"
              value={folioNumber}
              onChange={(e) => setFolioNumber(e.target.value)}
            />
          </label>

          <label className="field-group">
            <span>Company</span>
            <AsyncSelect
              cacheOptions
              defaultOptions
              classNamePrefix="company-select"
              placeholder="Search company"
              loadOptions={loadCompanyOptions}
              value={companyId ? { value: companyId, label: companyLabel } : null}
              onChange={(selected) => {
                if (!selected) {
                  setCompanyId("");
                  setCompanyLabel("");
                  return;
                }

                setCompanyId(selected.value);
                setCompanyLabel(selected.label);
              }}
              isClearable
            />
          </label>

          <div className="field-group">
            <span>Case Type</span>
            <div className="case-type-group" role="group" aria-label="Case type">
              {CASE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`case-type-option ${caseType === type ? "active" : ""}`}
                  onClick={() => setCaseType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="add-case-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>

          <button type="button" className="btn" onClick={handleContinue} disabled={loading}>
            {loading ? "Creating..." : "Continue to Form"}
          </button>
        </div>
      </section>
    </main>
  );
}
