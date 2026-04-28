import { useState } from "react";
import { updateStage, uploadStageDocument, addQuery } from "../../../api/caseApi";

const STAGES = [
  { key: "mail_sent", label: "Mail Sent to Client" },
  { key: "client_docs_received", label: "Client Docs Received" },
  { key: "doc_generated", label: "Document Generated" },
  { key: "doc_sent", label: "Document Sent to Client" },
  { key: "doc_received", label: "Document Received from Client" },
  { key: "ops_review", label: "Ops Review & Sign-off" },
  { key: "sent_to_rta", label: "Sent to Company/RTA" },
  { key: "query_cycle", label: "Query Cycle", isDynamic: true },
  { key: "loc_received", label: "LOC/LOE Received" },
  { key: "iepf_generated", label: "IEPF Form Generated" },
  { key: "iepf_submitted", label: "IEPF Submitted" },
  { key: "everification", label: "E-Verification Approved" },
  { key: "shares_credited", label: "Shares Credited" },
  { key: "closed", label: "Case Closed" },
];

export default function CaseStatus({ caseData, clientId, refresh }) {
  const [loadingStage, setLoadingStage] = useState(null);

  const handleStageComplete = async (stageKey) => {
    try {
      setLoadingStage(stageKey);
      await updateStage(clientId, caseData.case_id, stageKey);
      refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to update stage");
    } finally {
      setLoadingStage(null);
    }
  };

  const handleFileUpload = async (stageKey, selectedFiles) => {
    const formData = new FormData();

    // 🔥 MUST be "files"
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("files", selectedFiles[i]);
    }

    await uploadStageDocument(clientId, caseId, stageKey, formData);
  };

  const handleAddQuery = async () => {
    try {
      await addQuery(clientId, caseData.case_id);
      refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const getStageData = (key) => {
    return caseData.stages?.find((s) => s.key === key) || {};
  };

  return (
    <div className="card">
      <h3>Case Progress Tracker</h3>

      <table className="status-table">
        <thead>
          <tr>
            <th>Stage</th>
            <th>Upload Docs</th>
            <th>Last Updated</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {STAGES.map((stage) => {
            const stageData = getStageData(stage.key);

            // 🔁 Special handling for Query Cycle
            if (stage.key === "query_cycle") {
              return (
                <tr key="query_cycle">
                  <td>{stage.label}</td>
                  <td colSpan={3}>
                    <button onClick={handleAddQuery}>
                      + Add Query
                    </button>

                    {stageData.queries?.map((q, index) => (
                      <div key={index} className="query-box">
                        <strong>Q{index + 1}</strong>

                        <input
                          type="file"
                          onChange={(e) =>
                            handleFileUpload(
                              `query_${index + 1}`,
                              e.target.files[0]
                            )
                          }
                        />

                        <span>
                          {q.updated_at
                            ? new Date(q.updated_at).toLocaleString()
                            : "—"}
                        </span>
                      </div>
                    ))}
                  </td>
                </tr>
              );
            }

            return (
              <tr key={stage.key}>
                <td>{stage.label}</td>

                {/* Upload */}
                <td>
                  <input
                    type="file"
                    onChange={(e) =>
                      handleFileUpload(stage.key, e.target.files[0])
                    }
                  />
                </td>

                {/* Timestamp */}
                <td>
                  {stageData.updated_at
                    ? new Date(stageData.updated_at).toLocaleString()
                    : "—"}
                </td>

                {/* Action */}
                <td>
                  <button
                    disabled={loadingStage === stage.key}
                    onClick={() => handleStageComplete(stage.key)}
                  >
                    {stageData.completed ? "✔ Done" : "Mark Complete"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}