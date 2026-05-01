import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { deleteCase, getCaseDetails } from "../../api/caseApi";
import ConfirmationModal from "../../components/ConfirmationModal";
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
  const [activeTab, setActiveTab] = useState("stages");
  const [showDeleteCase, setShowDeleteCase] = useState(false);
  const [deleteCaseInput, setDeleteCaseInput] = useState("");

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

  const isStageCompleted = (caseData, stageKey) => {
    return Boolean(caseData?.stages?.find((stage) => stage.key === stageKey)?.completed);
  };

  const handleDeleteCase = async () => {
    try {
      await deleteCase(clientId, caseId, deleteCaseInput);
      navigate(`/clients/${clientId}`);
    } catch (err) {
      console.error("Error deleting case:", err);
      alert(err.response?.data?.detail || "Failed to delete case");
    }
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
  const documentsReadyForGeneration =
    isStageCompleted(caseData, "mail_sent") &&
    isStageCompleted(caseData, "client_docs_received");

  return (
    <div className="container case-details-page">
      <div className="back-link" onClick={() => navigate(`/clients/${clientId}`)}>
        ← Back to Client
      </div>

      <div className="details-header">
        <div>
          <h2>{client.name}</h2>
        </div>
        <button className="btn-outline remove-btn" onClick={() => setShowDeleteCase(true)}>
          Delete Case
        </button>
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
        <button
          className={activeTab === "form" ? "active" : ""}
          onClick={() => setActiveTab("form")}
        >
          Form
        </button>
      </div>

      {activeTab === "form" && (
        <CaseInfo
          caseData={caseData}
          documentsReadyForGeneration={documentsReadyForGeneration}
        />
      )}

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

      {showDeleteCase && (
        <ConfirmationModal
          title="Delete case?"
          message={`This will permanently delete case ${caseData.case_id}, and all files uploaded for this case.`}
          detail="Type the Case ID exactly to confirm this irreversible action."
          confirmLabel="Delete Case"
          danger
          confirmDisabled={deleteCaseInput !== caseData.case_id}
          onCancel={() => {
            setShowDeleteCase(false);
            setDeleteCaseInput("");
          }}
          onConfirm={handleDeleteCase}
        >
          <div className="confirm-id-input">
            <label>
              Case ID
              <input
                className="input"
                value={deleteCaseInput}
                onChange={(event) => setDeleteCaseInput(event.target.value)}
                placeholder={caseData.case_id}
              />
            </label>
          </div>
        </ConfirmationModal>
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
