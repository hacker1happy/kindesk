import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getCaseDetails } from "../../api/caseApi";

import CaseHeader from "./components/CaseHeader";
import ClientInfoCard from "./components/ClientInfoCard";
import CaseStatus from "./components/CaseStatus";
import CaseInfo from "./components/CaseInfo";
import Documents from "./components/Documents";

export default function CaseDetails() {
  const { clientId, caseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clientId) {
      console.error("Missing clientId");
      setError("Client ID missing. Please navigate from client page.");
      return;
    }

    fetchData();
  }, [caseId, clientId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getCaseDetails(clientId, caseId);
      setData(res.data);
    } catch (err) {
      console.error("Error fetching case:", err);
      setError("Failed to load case details");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Loading state
  if (loading) return <p>Loading case details...</p>;

  // ✅ Error state
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

  // ✅ No data fallback
  if (!data) return <p>No data found</p>;

  return (
    <div className="container">

      {/* Back */}
      <div className="back-link" onClick={() => navigate(-1)}>
        ← Back
      </div>

      {/* Case Header */}
      <CaseHeader caseData={data.case} />

      {/* Client Info */}
      <ClientInfoCard client={data.client} />

      {/* Case Status (with refresh) */}
      <CaseStatus
        caseData={data.case}
        clientId={clientId}   // ✅ IMPORTANT for update API
        refresh={fetchData}
      />

      {/* Case Info */}
      <CaseInfo caseData={data.case} />

      {/* Documents */}
      <Documents caseData={data.case} />
    </div>
  );
}