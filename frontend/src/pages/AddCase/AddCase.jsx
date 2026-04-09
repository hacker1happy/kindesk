import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createCase } from "../../api/caseApi";

export default function AddCase() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [folioNumber, setFolioNumber] = useState("");
  const [company, setCompany] = useState("");
  const [caseType, setCaseType] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!folioNumber || !company || !caseType) {
      alert("All fields required");
      return;
    }

    try {
      setLoading(true);

      const res = await createCase(clientId, {
        folio_number: folioNumber,
        company,
        case_type: caseType,
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
    <div className="case-container">
      <h2>Add New Case</h2>

      <div className="case-card">
        <h3>Case Information</h3>

        <input
          type="text"
          placeholder="Folio Number"
          value={folioNumber}
          onChange={(e) => setFolioNumber(e.target.value)}
        />

        <input
          type="text"
          placeholder="Company Name"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />

        <div className="case-type-group">
          {["Duplicate", "Transmission", "Joint"].map((type) => (
            <button
              key={type}
              className={`case-btn ${caseType === type ? "active" : ""}`}
              onClick={() => setCaseType(type)}
            >
              {type}
            </button>
          ))}
        </div>

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