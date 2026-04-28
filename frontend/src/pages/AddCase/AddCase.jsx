import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async"; // ❗ no creatable (controlled master)
import { createCase } from "../../api/caseApi";
import { fetchCompanies } from "../../api/companyApi";

export default function AddCase() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [folioNumber, setFolioNumber] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companyLabel, setCompanyLabel] = useState("");
  const [caseType, setCaseType] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔍 Load companies from backend
  const loadCompanyOptions = async (inputValue) => {
    try {
      const res = await fetchCompanies(inputValue);

      return res.data.map((c) => ({
        value: c.company_id,           // ✅ ID
        label: c.company_name,         // ✅ display name
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

      navigate(
        `/clients/${clientId}/cases/${caseId}/${caseType.toLowerCase()}`
      );
    } catch (err) {
      console.error(err);
      alert("Error creating case");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="case-container">
      <h2>Add New Case</h2>

      <div className="case-card">
        <h3>Case Information</h3>

        {/* Folio Number */}
        <input
          type="text"
          placeholder="Folio Number"
          value={folioNumber}
          onChange={(e) => setFolioNumber(e.target.value)}
        />

        {/* Company Dropdown */}
        <div style={{ marginBottom: "1rem" }}>
          <AsyncSelect
            cacheOptions
            defaultOptions
            placeholder="Search company"
            loadOptions={loadCompanyOptions}
            value={
              companyId
                ? { value: companyId, label: companyLabel }
                : null
            }
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
        </div>

        {/* Case Type */}
        <div className="case-type-group">
          {["Duplicate", "Transmission", "Joint"].map((type) => (
            <button
              key={type}
              className={`case-btn ${caseType === type ? "active" : ""
                }`}
              onClick={() => setCaseType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="actions">
          <button onClick={() => navigate(-1)}>Cancel</button>

          <button onClick={handleContinue} disabled={loading}>
            {loading ? "Creating..." : "Continue to Form"}
          </button>
        </div>
      </div>
    </div>
  );
}