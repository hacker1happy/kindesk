import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getClientById, getCases } from "../api/clientApi";

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);

  useEffect(() => {
    loadClient();
    loadCases();
  }, []);

  const loadClient = async () => {
    const res = await getClientById(id);
    setClient(res.data);
  };

  const loadCases = async () => {
    try {
      setLoadingCases(true);
      const res = await getCases(id);
      setCases(res.data);
    } catch (err) {
      console.error("Error loading cases:", err);
    } finally {
      setLoadingCases(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleViewCase = (caseType, caseId) => {
    const caseTypeLower = caseType.toLowerCase();
    navigate(`/cases/${caseTypeLower}/${caseId}`);
  };

  if (!client) return <p>Loading...</p>;

  return (
    <div className="container">

      {/* Back */}
      <div className="back-link" onClick={() => navigate("/")}>
        ← Back to Dashboard
      </div>

      {/* Header */}
      <div className="details-header">
        <div>
          <h2>{client.name}</h2>
          <p style={{ color: "#6b7280" }}>
            Client ID: {client.id}
          </p>
        </div>
        <button className="btn" onClick={() => navigate(`/clients/${client.id}/cases`)}>
          + Add Case
        </button>
      </div>

      {/* Client Info */}
      <div className="info-card">
        <h3>Client Information</h3>

        <div className="info-grid">
          <div>
            <p className="label">Phone Number</p>
            <p className="value">{client.phone}</p>
          </div>

          <div>
            <p className="label">Assigned To</p>
            <p className="value">{client.assigned_to}</p>
          </div>

          <div>
            <p className="label">Assigned From</p>
            <p className="value">{client.assigned_from}</p>
          </div>

          <div>
            <p className="label">Date of Addition</p>
            <p className="value">
              {formatDate(client.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Global Files */}
      <div className="info-card">
        <h3>Global Files</h3>

        {client.files?.length === 0 ? (
          <p>No files uploaded</p>
        ) : (
          client.files.map((file, idx) => (
            <div key={idx} className="file-item">
              <div>
                <p>{file.split("/").pop()}</p>
                <small>{formatDate(client.created_at)}</small>
              </div>

              <a href={`http://127.0.0.1:8000/${file}`} download>
                ⬇
              </a>
            </div>
          ))
        )}
      </div>

      {/* Cases Table */}
      <div className="info-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>Cases</h3>
          <span className="badge">{cases.length} total</span>
        </div>

        {loadingCases ? (
          <p>Loading cases...</p>
        ) : cases.length === 0 ? (
          <div className="case-empty">
            <p>No cases yet. Add a case to get started.</p>
            <button className="btn" style={{ marginTop: "15px" }} onClick={() => navigate(`/clients/${client.id}/cases`)}>
              + Add First Case
            </button>
          </div>
        ) : (
          <div className="cases-table-container">
            <table className="cases-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Case Type</th>
                  <th>Folio Number</th>
                  <th>Company Name</th>
                  <th>Created At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((caseItem) => (
                  <tr key={caseItem.case_id}>
                    <td>{caseItem.case_id}</td>
                    <td>
                      <span className={`case-type-badge case-type-${caseItem.case_type?.toLowerCase()}`}>
                        {caseItem.case_type}
                      </span>
                    </td>
                    <td>{caseItem.folio_number}</td>
                    <td>{caseItem.company}</td>
                    <td>{formatDate(caseItem.created_at)}</td>
                    <td>
                      <span className={`status-badge status-${caseItem.status?.toLowerCase() || 'active'}`}>
                        {caseItem.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="view-case-btn"
                        onClick={() => handleViewCase(caseItem.case_type, caseItem.id)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}