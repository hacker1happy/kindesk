import { updateCaseStatus } from "../../../api/caseApi";

const STATUS_OPTIONS = [
  "fresh",
  "doc_generated",
  "sent_to_rta",
  "query",
  "lo_confirmation",
  "lo_entitlement",
  "closed",
];

const formatLabel = (status) => {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function CaseStatus({ caseData, clientId, refresh }) {

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;

    try {
      await updateCaseStatus(clientId, caseData.case_id, newStatus);
      refresh();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  return (
    <div className="card">
      <h3>Case Status</h3>

      <div className="status-row">

        {/* Current Status */}
        <div>
          <p className="label">Current Status</p>
          <span className={`status-badge status-${caseData.status}`}>
            {formatLabel(caseData.status || "fresh")}
          </span>
        </div>

        {/* Change Status Dropdown */}
        <div>
          <p className="label">Update Status</p>

          <select
            value={caseData.status || "fresh"}
            onChange={handleStatusChange}
            className="status-dropdown"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {formatLabel(status)}
              </option>
            ))}
          </select>
        </div>

      </div>
    </div>
  );
}