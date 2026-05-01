import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCaseDetails } from "../../api/caseApi";
import CaseStatus from "./components/CaseStatus";
import CaseInfo from "./components/CaseInfo";
import Documents from "./components/Documents";
import "./CaseDetails.css";

export default function CaseDetails() {
  const { clientId, caseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("form");

  useEffect(() => {
    if (!clientId) {
      setError("Client ID missing. Please navigate from client page.");
      return;
    }

    fetchData();
  }, [caseId, clientId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCaseDetails(clientId, caseId);
      setData(res.data);
    } catch (err) {
      console.error("Error fetching case:", err);
      setError("Failed to load case details");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";

    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status = "fresh") => {
    const normalizedStatus = status.toLowerCase();

    if (/^q\d+_/.test(normalizedStatus)) return "query";

    return normalizedStatus;
  };

  if (loading) return <p className="container">Loading case details...</p>;

  if (error) {
    return (
      <div className="container">
        <p style={{ color: "red" }}>{error}</p>
        <button className="btn" onClick={() => navigate("/")}>
          Go Back
        </button>
      </div>
    );
  }

  if (!data) return <p className="container">No data found</p>;

  const caseData = data.case;
  const client = data.client;

  return (
    <div className="container case-details-page">
      <div className="back-link" onClick={() => navigate(`/clients/${clientId}`)}>
        ← Back to Client
      </div>

      <div className="details-header">
        <div>
          <h2>{client.name}</h2>
        </div>
      </div>

      <section className="info-card">
        <div className="client-info-row">
          <InfoItem label="Client ID" value={client.id} />
          <InfoItem label="Phone" value={client.phone} />
          <InfoItem label="Assigned To" value={client.assigned_to} />
          <InfoItem label="Assigned From" value={client.assigned_from} />
        </div>
      </section>

      <section className="info-card">
        <div className="section-header">
          <h3>Case Details</h3>
          <span className={`status-badge status-${getStatusClass(caseData.status)}`}>
            {caseData.status || "fresh"}
          </span>
        </div>

        <div className="case-info-row">
          <InfoItem label="Case ID" value={caseData.case_id} />
          <InfoItem label="Folio Number" value={caseData.folio_number} />
          <InfoItem label="Company" value={caseData.company_name || caseData.company || caseData.company_id} />
          <InfoItem label="Case Type" value={caseData.case_type} />
          <InfoItem label="Created" value={formatDate(caseData.created_at)} />
        </div>
      </section>

      <div className="case-tabs">
        <button
          className={activeTab === "form" ? "active" : ""}
          onClick={() => setActiveTab("form")}
        >
          Form
        </button>
        <button
          className={activeTab === "stages" ? "active" : ""}
          onClick={() => setActiveTab("stages")}
        >
          Case Stages
        </button>
        <button
          className={activeTab === "documents" ? "active" : ""}
          onClick={() => setActiveTab("documents")}
        >
          Documents
        </button>
      </div>

      {activeTab === "form" && <CaseInfo caseData={caseData} />}

      {activeTab === "stages" && (
        <CaseStatus
          caseData={caseData}
          clientId={clientId}
          refresh={fetchData}
        />
      )}

      {activeTab === "documents" && (
        <Documents caseData={caseData} refresh={fetchData} />
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <span className="info-label">{label}:</span>
      <span className="info-value">{value || "-"}</span>
    </div>
  );
}
