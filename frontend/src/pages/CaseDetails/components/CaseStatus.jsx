import { useState } from "react";
import {
  addQuery,
  closeQuery,
  updateStage,
  uploadQueryDocument,
  uploadStageDocument,
} from "../../../api/caseApi";

const QUERY_AFTER_STAGE = "sent_to_rta";

export default function CaseStatus({ caseData, clientId, refresh }) {
  const [loadingKey, setLoadingKey] = useState(null);

  const stages = caseData.stages || [];
  const queries = caseData.queries || [];

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";

    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStageComplete = async (stageKey) => {
    try {
      setLoadingKey(stageKey);
      await updateStage(clientId, caseData.case_id, stageKey);
      await refresh();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to update stage");
    } finally {
      setLoadingKey(null);
    }
  };

  const handleStageUpload = async (stageKey, selectedFiles) => {
    try {
      if (!selectedFiles?.length) return;

      setLoadingKey(`${stageKey}-upload`);
      const formData = new FormData();
      Array.from(selectedFiles).forEach((file) => formData.append("files", file));

      await uploadStageDocument(clientId, caseData.case_id, stageKey, formData);
      await refresh();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to upload stage document");
    } finally {
      setLoadingKey(null);
    }
  };

  const handleAddQuery = async () => {
    try {
      setLoadingKey("add-query");
      await addQuery(clientId, caseData.case_id);
      await refresh();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to add query");
    } finally {
      setLoadingKey(null);
    }
  };

  const handleQueryUpload = async (queryNo, selectedFile) => {
    try {
      if (!selectedFile) return;

      setLoadingKey(`query-${queryNo}-upload`);
      const formData = new FormData();
      formData.append("file", selectedFile);

      await uploadQueryDocument(clientId, caseData.case_id, queryNo, formData);
      await refresh();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to upload query document");
    } finally {
      setLoadingKey(null);
    }
  };

  const handleCloseQuery = async (queryNo) => {
    try {
      setLoadingKey(`query-${queryNo}-close`);
      await closeQuery(clientId, caseData.case_id, queryNo);
      await refresh();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to close query");
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <section className="info-card case-progress-card">
      <div className="section-header">
        <h3>Case Stages</h3>
        <button
          className="btn-outline"
          onClick={handleAddQuery}
          disabled={loadingKey === "add-query"}
        >
          + Add Query
        </button>
      </div>

      <div className="stage-list">
        {stages.map((stage) => (
          <div key={stage.key}>
            <StageRow
              stage={stage}
              loadingKey={loadingKey}
              formatDateTime={formatDateTime}
              onUpload={handleStageUpload}
              onComplete={handleStageComplete}
            />

            {stage.key === QUERY_AFTER_STAGE && (
              <div className="query-list">
                {queries.length === 0 ? (
                  <p className="empty-text compact-empty">No queries opened</p>
                ) : (
                  queries.map((query) => (
                    <QueryRow
                      key={query.query_no}
                      query={query}
                      loadingKey={loadingKey}
                      formatDateTime={formatDateTime}
                      onUpload={handleQueryUpload}
                      onClose={handleCloseQuery}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function StageRow({ stage, loadingKey, formatDateTime, onUpload, onComplete }) {
  const documents = stage.documents || [];
  const latestDocument = documents[documents.length - 1];

  return (
    <div className={`stage-row ${stage.completed ? "completed" : ""}`}>
      <div className="stage-main">
        <span className="stage-status-dot" />
        <div>
          <strong>{stage.label}</strong>
          <p>
            {documents.length} doc{documents.length === 1 ? "" : "s"}
            {latestDocument ? `, latest ${formatDateTime(latestDocument.uploaded_at)}` : ""}
          </p>
        </div>
      </div>

      <div className="stage-actions">
        <label className="btn-outline compact-upload">
          Upload
          <input
            type="file"
            multiple
            hidden
            onChange={(e) => onUpload(stage.key, e.target.files)}
          />
        </label>
        <button
          className="btn-outline"
          disabled={loadingKey === stage.key || stage.completed}
          onClick={() => onComplete(stage.key)}
        >
          {stage.completed ? "Done" : "Mark Done"}
        </button>
      </div>
    </div>
  );
}

function QueryRow({ query, loadingKey, formatDateTime, onUpload, onClose }) {
  const documents = query.documents || [];
  const latestDocument = documents[documents.length - 1];
  const isClosed = query.status === "closed";

  return (
    <div className={`query-row ${isClosed ? "completed" : ""}`}>
      <div className="stage-main">
        <span className="query-status-dot" />
        <div>
          <strong>Query {query.query_no}</strong>
          <p>
            {isClosed ? "Closed" : "Open"} · {documents.length} doc{documents.length === 1 ? "" : "s"}
            {latestDocument ? `, latest ${formatDateTime(latestDocument.uploaded_at)}` : ""}
          </p>
        </div>
      </div>

      <div className="stage-actions">
        <label className="btn-outline compact-upload">
          Upload
          <input
            type="file"
            hidden
            onChange={(e) => onUpload(query.query_no, e.target.files?.[0])}
          />
        </label>
        <button
          className="btn-outline"
          disabled={isClosed || loadingKey === `query-${query.query_no}-close`}
          onClick={() => onClose(query.query_no)}
        >
          {isClosed ? "Resolved" : "Resolve"}
        </button>
      </div>
    </div>
  );
}
