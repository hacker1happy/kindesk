import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getCaseDocuments,
  uploadCaseDocument,
  deleteCaseDocument,
} from "../../../api/caseDocuments";
import { uploadQueryDocument, uploadStageDocument } from "../../../api/caseApi";

const API_BASE = "http://127.0.0.1:8000";

export default function Documents({ caseData, refresh }) {
  const { clientId, caseId } = useParams();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);

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

  const stageDocuments = useMemo(() => {
    return (caseData?.stages || []).map((stage) => ({
      ...stage,
      documents: sortByUploadTime(stage.documents || []),
    }));
  }, [caseData]);

  const queryDocuments = useMemo(() => {
    return sortByUploadTime(
      (caseData?.queries || []).flatMap((query) =>
        (query.documents || []).map((document) => ({
          ...document,
          query_no: query.query_no,
          status: query.status,
        }))
      )
    );
  }, [caseData]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await getCaseDocuments(clientId, caseId);
      setFiles(sortByUploadTime(res.data.files || []));
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

  const handleUpload = async (e) => {
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

  const handleStageUpload = async (stageKey, selectedFiles) => {
    if (!selectedFiles?.length) return;

    try {
      setUploadingKey(stageKey);
      const formData = new FormData();
      Array.from(selectedFiles).forEach((file) => formData.append("files", file));

      await uploadStageDocument(clientId, caseId, stageKey, formData);
      await refresh?.();
    } catch (err) {
      console.error("Stage upload failed", err);
      alert(err.response?.data?.detail || "Stage upload failed");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleQueryUpload = async (queryNo, selectedFile) => {
    if (!selectedFile) return;

    try {
      setUploadingKey(`query-${queryNo}`);
      const formData = new FormData();
      formData.append("file", selectedFile);

      await uploadQueryDocument(clientId, caseId, queryNo, formData);
      await refresh?.();
    } catch (err) {
      console.error("Query upload failed", err);
      alert(err.response?.data?.detail || "Query upload failed");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleDelete = async (file) => {
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
        <h3>Case Documents</h3>

        <label className="btn-outline">
          {uploading ? "Uploading..." : "+ Upload"}
          <input type="file" multiple hidden onChange={handleUpload} />
        </label>
      </div>

      {loading ? (
        <p>Loading documents...</p>
      ) : files.length === 0 ? (
        <p className="empty-text">No case documents uploaded.</p>
      ) : (
        <div className="files-list">
          {files.map((doc) => (
            <DocumentRow
              key={doc.url}
              doc={doc}
              formatDateTime={formatDateTime}
              onOpen={handleOpenFile}
              onDownload={handleDownloadFile}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <div className="document-subsection">
        <h4>Stage Documents</h4>
        <div className="stage-document-list">
          {stageDocuments.map((stage) => (
            <div key={stage.key} className="stage-document-row">
              <div>
                <strong>{stage.label}</strong>
                <p>
                  {stage.documents.length} doc{stage.documents.length === 1 ? "" : "s"}
                  {stage.documents[0] ? `, latest ${formatDateTime(stage.documents[0].uploaded_at)}` : ""}
                </p>
              </div>
              <label className="btn-outline compact-upload">
                {uploadingKey === stage.key ? "Uploading..." : "Update"}
                <input
                  type="file"
                  multiple
                  hidden
                  onChange={(e) => handleStageUpload(stage.key, e.target.files)}
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="document-subsection">
        <h4>Query Documents</h4>
        {queryDocuments.length === 0 ? (
          <p className="empty-text">No query documents uploaded.</p>
        ) : (
          <div className="files-list">
            {queryDocuments.map((doc) => (
              <DocumentRow
                key={doc.url}
                doc={{ ...doc, name: `Query ${doc.query_no} - ${doc.name}` }}
                formatDateTime={formatDateTime}
                onOpen={handleOpenFile}
                onDownload={handleDownloadFile}
              />
            ))}
          </div>
        )}

        {(caseData?.queries || []).map((query) => (
          <label key={query.query_no} className="btn-outline compact-query-upload">
            {uploadingKey === `query-${query.query_no}` ? "Uploading..." : `Update Query ${query.query_no}`}
            <input
              type="file"
              hidden
              onChange={(e) => handleQueryUpload(query.query_no, e.target.files?.[0])}
            />
          </label>
        ))}
      </div>
    </section>
  );
}

function DocumentRow({ doc, formatDateTime, onOpen, onDownload, onDelete }) {
  return (
    <div className="compact-file-item">
      <div className="file-info-row">
        <span className="file-name">{doc.name}</span>
        <span className="file-date">Uploaded on {formatDateTime(doc.uploaded_at)}</span>
      </div>

      <div className="file-actions">
        <button className="btn-outline file-btn open-file-btn" onClick={() => onOpen(doc.url)}>
          Open
        </button>
        <button className="btn-outline file-btn download-file-btn" onClick={() => onDownload(doc.name, doc.url)}>
          Download
        </button>
        {onDelete && (
          <button className="btn-outline remove-btn" onClick={() => onDelete(doc)}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
