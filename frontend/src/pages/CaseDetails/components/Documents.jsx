import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  deleteCaseDocument,
  downloadAllCaseDocumentsUrl,
  getCaseDocuments,
  uploadCaseDocument,
} from "../../../api/caseDocuments";
import {
  removeQueryDocument,
  removeStageDocument,
  replaceQueryDocument,
  replaceStageDocument,
  uploadQueryDocument,
  uploadStageDocument,
} from "../../../api/caseApi";

const API_BASE = "http://127.0.0.1:8000";

export default function Documents({ caseData, refresh }) {
  const { clientId, caseId } = useParams();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [workingKey, setWorkingKey] = useState(null);

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

  const getDocumentSummary = (documents) => {
    const latestDocument = documents[0];

    return `${documents.length} doc${documents.length === 1 ? "" : "s"}${
      latestDocument ? `, latest ${formatDateTime(latestDocument.uploaded_at)}` : ""
    }`;
  };

  const managedDocumentGroups = useMemo(() => {
    const stageGroups = (caseData?.stages || []).map((stage) => ({
      id: `stage-${stage.key}`,
      type: "stage",
      key: stage.key,
      label: stage.label,
      documents: sortByUploadTime(stage.documents || []),
    }));

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

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await getCaseDocuments(clientId, caseId);
      setFiles(res.data.files || []);
    } catch (err) {
      console.error("Error fetching documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [clientId, caseId]);

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

  const handleGeneratedUpload = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles.length) return;

    const formData = new FormData();
    Array.from(selectedFiles).forEach((file) => formData.append("files", file));

    try {
      setUploading(true);
      await uploadCaseDocument(clientId, caseId, formData);
      await fetchDocuments();
      e.target.value = "";
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
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

  const handleDeleteGenerated = async (file) => {
    try {
      const filename = file.stored_name || file.url.split("/").pop();

      await deleteCaseDocument(clientId, caseId, filename);
      await fetchDocuments();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed");
    }
  };

  return (
    <section className="info-card">
      <div className="section-header">
        <h3>Generated Case Documents</h3>

        <div className="document-header-actions">
          <a className="btn-outline download-file-btn" href={downloadAllCaseDocumentsUrl(clientId, caseId)}>
            Download All
          </a>
          <label className="btn-outline">
            {uploading ? "Uploading..." : "+ Upload"}
            <input type="file" multiple hidden onChange={handleGeneratedUpload} />
          </label>
        </div>
      </div>

      {loading ? (
        <p>Loading documents...</p>
      ) : files.length === 0 ? (
        <p className="empty-text">No generated documents found.</p>
      ) : (
        <div className="files-list">
          {files.map((doc) => (
            <DocumentRow
              key={doc.url}
              doc={doc}
              formatDateTime={formatDateTime}
              onDownload={handleDownloadFile}
              onDelete={handleDeleteGenerated}
            />
          ))}
        </div>
      )}

      <div className="document-subsection">
        <h4>Stage Documents</h4>
        <div className="stage-document-list">
          {managedDocumentGroups.map((group) => (
            <details key={group.id} className={`stage-document-row stage-${group.type === "query" ? "query" : group.key}`}>
              <summary>
                <div className="stage-document-summary">
                  <strong>{group.label}</strong>
                  <span>{getDocumentSummary(group.documents)}</span>
                </div>
                <label className="btn-outline compact-upload" onClick={(e) => e.stopPropagation()}>
                  {workingKey === `${group.id}-upload` ? "Uploading..." : group.documents.length ? "Add" : "Upload"}
                  <input
                    type="file"
                    multiple={group.type === "stage"}
                    hidden
                    onChange={(e) => handleGroupUpload(group, e.target.files)}
                  />
                </label>
              </summary>

              {group.details && <p className="managed-doc-note">{group.details}</p>}

              {group.documents.length === 0 ? (
                <p className="empty-text compact-empty">No documents uploaded.</p>
              ) : (
                <div className="managed-doc-list">
                  {group.documents.map((doc) => (
                    <DocumentRow
                      key={doc.url}
                      doc={doc}
                      formatDateTime={formatDateTime}
                      onOpen={handleOpenFile}
                      onDownload={handleDownloadFile}
                      onReplace={(document, file) => handleReplaceManagedDocument(group, document, file)}
                      onDelete={
                        group.documents.length > 1
                          ? (document) => handleRemoveManagedDocument(group, document)
                          : null
                      }
                      removeDisabledReason={
                        group.documents.length <= 1 ? "Replace the only document instead of removing it." : ""
                      }
                    />
                  ))}
                </div>
              )}
            </details>
          ))}
        </div>
      </div>
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
  removeDisabledReason,
}) {
  const handleDelete = () => {
    const shouldRemove = window.confirm(`Remove "${doc.name}" from documents?`);

    if (!shouldRemove) return;

    onDelete(doc);
  };

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
        {onReplace && (
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
          <button className="btn-outline remove-btn" onClick={handleDelete}>
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
