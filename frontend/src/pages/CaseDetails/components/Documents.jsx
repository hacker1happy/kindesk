import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  downloadAllStageDocumentsUrl,
  downloadStageDocumentsUrl,
  removeMiscDocument,
  removeQueryDocument,
  removeStageDocument,
  replaceQueryDocument,
  replaceStageDocument,
  uploadMiscDocument,
  uploadQueryDocument,
  uploadStageDocument,
} from "../../../api/caseApi";
import ConfirmationModal from "../../../components/ConfirmationModal";

const API_BASE = "http://127.0.0.1:8000";
const OPTIONAL_DOCUMENT_STAGES = new Set([
  "mail_sent",
  "doc_sent",
  "doc_received",
  "ops_review",
  "iepf_generated",
  "everification",
  "shares_credited",
  "closed",
]);
const NON_UPLOAD_STAGE_KEYS = new Set([
  "mail_sent",
  "doc_generated",
  "doc_sent",
  "doc_received",
  "ops_review",
  "iepf_generated",
  "everification",
  "shares_credited",
  "closed",
]);
const IEPF_WORKFLOW_STAGES = new Set(["iepf_generated", "iepf_submitted", "everification"]);

export default function Documents({ caseData, refresh }) {
  const { clientId, caseId } = useParams();

  const [workingKey, setWorkingKey] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);

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

  const sortByUploadTime = (items) => {
    return [...items].sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0));
  };

  const sortByFilename = (items) => {
    return [...items].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
  };

  const getDocumentSummary = (documents) => {
    const latestDocument = sortByUploadTime(documents)[0];

    return `${documents.length} doc${documents.length === 1 ? "" : "s"}${
      latestDocument ? `, latest ${formatDateTime(latestDocument.uploaded_at)}` : ""
    }`;
  };

  const managedDocumentGroups = useMemo(() => {
    const stages = caseData?.stages || [];
    const locCompleted = Boolean(stages.find((stage) => stage.key === "loc_received")?.completed);
    const loeCompleted = Boolean(stages.find((stage) => stage.key === "loe_received")?.completed);
    const visibleStages = stages.filter((stage) => {
      if (locCompleted) return stage.key !== "loe_received" && !IEPF_WORKFLOW_STAGES.has(stage.key);
      if (loeCompleted) return stage.key !== "loc_received";
      return !IEPF_WORKFLOW_STAGES.has(stage.key);
    });
    const stageGroups = visibleStages
      .map((stage) => ({
        id: `stage-${stage.key}`,
        type: "stage",
        key: stage.key,
        label: stage.label,
        documents:
          stage.key === "doc_generated"
            ? sortByFilename(stage.documents || [])
            : sortByUploadTime(stage.documents || []),
      }))
      .filter((group) => !NON_UPLOAD_STAGE_KEYS.has(group.key) || group.documents.length > 0);

    const queryGroups = (caseData?.queries || []).map((query) => ({
      id: `query-${query.query_no}`,
      type: "query",
      key: query.query_no,
      label: `Query ${query.query_no}`,
      details: query.details,
      documents: sortByUploadTime(query.documents || []),
    }));

    return stageGroups.flatMap((stageGroup) => {
      if (stageGroup.key === "sent_to_rta") {
        return [stageGroup, ...queryGroups];
      }

      return [stageGroup];
    });
  }, [caseData]);

  const miscDocuments = sortByUploadTime(caseData?.misc_documents || []);

  const getFileUrl = (url) => `${API_BASE}${url}`;

  const handleOpenFile = (url) => {
    window.open(getFileUrl(url), "_blank", "noopener,noreferrer");
  };

  const handleDownloadFile = async (name, url) => {
    try {
      const response = await fetch(getFileUrl(url));
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download file");
    }
  };

  const handleGroupUpload = async (group, selectedFiles) => {
    if (!selectedFiles?.length) return;

    try {
      setWorkingKey(`${group.id}-upload`);

      if (group.type === "stage") {
        const formData = new FormData();
        Array.from(selectedFiles).forEach((file) => formData.append("files", file));
        await uploadStageDocument(clientId, caseId, group.key, formData);
      } else {
        const formData = new FormData();
        formData.append("file", selectedFiles[0]);
        await uploadQueryDocument(clientId, caseId, group.key, formData);
      }

      await refresh?.();
    } catch (err) {
      console.error("Upload failed", err);
      alert(err.response?.data?.detail || "Upload failed");
    } finally {
      setWorkingKey(null);
    }
  };

  const handleMiscUpload = async (selectedFiles) => {
    if (!selectedFiles?.length) return;

    try {
      setWorkingKey("misc-upload");
      const formData = new FormData();
      Array.from(selectedFiles).forEach((file) => formData.append("files", file));

      await uploadMiscDocument(clientId, caseId, formData);
      await refresh?.();
    } catch (err) {
      console.error("Misc upload failed", err);
      alert(err.response?.data?.detail || "Upload failed");
    } finally {
      setWorkingKey(null);
    }
  };

  const handleReplaceManagedDocument = async (group, document, selectedFile) => {
    if (!selectedFile) return;

    try {
      setWorkingKey(`${group.id}-${document.url}-replace`);
      const formData = new FormData();
      formData.append("old_url", document.url);
      formData.append("file", selectedFile);

      if (group.type === "stage") {
        await replaceStageDocument(clientId, caseId, group.key, formData);
      } else {
        await replaceQueryDocument(clientId, caseId, group.key, formData);
      }

      await refresh?.();
    } catch (err) {
      console.error("Replace failed", err);
      alert(err.response?.data?.detail || "Replace failed");
    } finally {
      setWorkingKey(null);
    }
  };

  const handleRemoveManagedDocument = async (group, document) => {
    try {
      setWorkingKey(`${group.id}-${document.url}-remove`);

      if (group.type === "stage") {
        await removeStageDocument(clientId, caseId, group.key, document.url);
      } else {
        await removeQueryDocument(clientId, caseId, group.key, document.url);
      }

      await refresh?.();
    } catch (err) {
      console.error("Remove failed", err);
      alert(err.response?.data?.detail || "Remove failed");
    } finally {
      setWorkingKey(null);
    }
  };

  const handleRemoveMiscDocument = async (document) => {
    try {
      setWorkingKey(`misc-${document.url}-remove`);

      await removeMiscDocument(clientId, caseId, document.url);
      await refresh?.();
    } catch (err) {
      console.error("Remove failed", err);
      alert(err.response?.data?.detail || "Remove failed");
    } finally {
      setWorkingKey(null);
    }
  };

  const handleConfirmRemoval = async () => {
    if (!pendingRemoval) return;

    if (pendingRemoval.type === "misc") {
      await handleRemoveMiscDocument(pendingRemoval.document);
    } else {
      await handleRemoveManagedDocument(pendingRemoval.group, pendingRemoval.document);
    }

    setPendingRemoval(null);
  };

  return (
    <section className="info-card">
      <div className="section-header">
        <h3>Stage Files</h3>
        <a className="btn-outline download-file-btn" href={downloadAllStageDocumentsUrl(clientId, caseId)}>
          Download All
        </a>
      </div>

        <div className="stage-document-list">
          {managedDocumentGroups.map((group) => (
            <details key={group.id} className={`stage-document-row stage-${group.type === "query" ? "query" : group.key}`}>
              <summary>
                <div className="stage-document-summary">
                  <strong>{group.label}</strong>
                  <span>{getDocumentSummary(group.documents)}</span>
                </div>
                {!NON_UPLOAD_STAGE_KEYS.has(group.key) && (
                  <label className="btn-outline compact-upload" onClick={(e) => e.stopPropagation()}>
                    {workingKey === `${group.id}-upload` ? "Uploading..." : group.documents.length ? "Add" : "Upload"}
                    <input
                      type="file"
                      multiple={group.type === "stage"}
                      hidden
                      onChange={(e) => handleGroupUpload(group, e.target.files)}
                    />
                  </label>
                )}
              </summary>

              {group.details && <p className="managed-doc-note">{group.details}</p>}

              {group.key === "doc_generated" && group.documents.length > 0 && (
                <div className="generated-doc-actions">
                  <a
                    className="btn-outline download-file-btn"
                    href={downloadStageDocumentsUrl(clientId, caseId, group.key)}
                  >
                    Download All
                  </a>
                </div>
              )}

              {group.documents.length === 0 ? (
                <p className="empty-text compact-empty">No documents uploaded.</p>
              ) : (
                <div className="managed-doc-list">
                  {group.documents.map((doc) => (
                    <DocumentRow
                      key={doc.url}
                      doc={doc}
                      formatDateTime={formatDateTime}
                      onOpen={group.key === "doc_generated" ? null : handleOpenFile}
                      onDownload={handleDownloadFile}
                      onReplace={(document, file) => handleReplaceManagedDocument(group, document, file)}
                      replaceDisabled={group.key === "doc_generated"}
                      onDelete={
                        group.key === "doc_generated"
                          ? null
                          :
                        group.type === "stage" && (OPTIONAL_DOCUMENT_STAGES.has(group.key) || group.documents.length > 1)
                          ? (document) => setPendingRemoval({ type: "managed", group, document })
                          : group.type === "query" && group.documents.length > 1
                            ? (document) => setPendingRemoval({ type: "managed", group, document })
                          : null
                      }
                      removeDisabledReason={
                        group.key === "doc_generated"
                          ? ""
                          :
                        group.documents.length <= 1 && !OPTIONAL_DOCUMENT_STAGES.has(group.key)
                          ? "Replace the only document instead of removing it."
                          : ""
                      }
                    />
                  ))}
                </div>
              )}
            </details>
          ))}
        </div>

      <div className="document-subsection">
        <div className="section-header">
          <h4>Miscellaneous Files</h4>
          <label className="btn-outline compact-upload">
            {workingKey === "misc-upload" ? "Uploading..." : "+ Upload"}
            <input type="file" multiple hidden onChange={(e) => handleMiscUpload(e.target.files)} />
          </label>
        </div>

        {miscDocuments.length === 0 ? (
          <p className="empty-text compact-empty">No miscellaneous files uploaded.</p>
        ) : (
          <div className="managed-doc-list">
            {miscDocuments.map((doc) => (
              <DocumentRow
                key={doc.url}
                doc={doc}
                formatDateTime={formatDateTime}
                onOpen={handleOpenFile}
                onDownload={handleDownloadFile}
                onDelete={(document) => setPendingRemoval({ type: "misc", document })}
              />
            ))}
          </div>
        )}
      </div>

      {pendingRemoval && (
        <ConfirmationModal
          title="Remove document?"
          message={`You are removing "${pendingRemoval.document.name}".`}
          detail="This action is irreversible and the file will be removed from this case."
          confirmLabel="Confirm Remove"
          danger
          onCancel={() => setPendingRemoval(null)}
          onConfirm={handleConfirmRemoval}
        />
      )}
    </section>
  );
}

function DocumentRow({
  doc,
  formatDateTime,
  onOpen,
  onDownload,
  onDelete,
  onReplace,
  replaceDisabled,
  removeDisabledReason,
}) {
  return (
    <div className="compact-file-item">
      <div className="file-info-row">
        <span className="file-name">{doc.name}</span>
        <span className="file-date">Uploaded on {formatDateTime(doc.uploaded_at)}</span>
      </div>

      <div className="file-actions">
        {onOpen && (
          <button className="btn-outline file-btn open-file-btn" onClick={() => onOpen(doc.url)}>
            Open
          </button>
        )}
        <button className="btn-outline file-btn download-file-btn" onClick={() => onDownload(doc.name, doc.url)}>
          Download
        </button>
        {onReplace && !replaceDisabled && (
          <label className="btn-outline file-btn">
            Replace
            <input
              type="file"
              hidden
              onChange={(e) => onReplace(doc, e.target.files?.[0])}
            />
          </label>
        )}
        {onDelete ? (
          <button className="btn-outline remove-btn" onClick={() => onDelete(doc)}>
            Remove
          </button>
        ) : removeDisabledReason ? (
          <button className="btn-outline remove-btn" disabled title={removeDisabledReason}>
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}
