import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getClientById, uploadClientDocuments, removeClientDocument, updateClient } from "../../api/clientApi";
import { getCases } from "../../api/caseApi";

import "./ClientDetails.css";


const API_BASE = "http://127.0.0.1:8000";

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const [client, setClient] = useState(null);
  const [cases, setCases] = useState([]);

  const [loadingCases, setLoadingCases] = useState(false);
  const [loadingClient, setLoadingClient] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [editingClient, setEditingClient] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    assigned_to: "",
    assigned_from: "",
    comment: "",
  });

  const assignedToOptions = ["Sachin", "Hari", "Deepak"];
  const assignedFromOptions = ["Pratha", "Richa", "Archana", "Gurmeen", "Dipesh"];

  useEffect(() => {
    if (id) {
      loadClient();
      loadCases();
    }
  }, [id]);

  const loadClient = async () => {
    try {
      setLoadingClient(true);

      const res = await getClientById(id);

      const nextClient = {
        id,
        ...res.data,
      };

      setClient(nextClient);
      setEditForm({
        name: nextClient.name || "",
        phone: nextClient.phone || "",
        assigned_to: nextClient.assigned_to || "",
        assigned_from: nextClient.assigned_from || "",
        comment: nextClient.comment || "",
      });
    } catch (err) {
      console.error("Error loading client:", err);
    } finally {
      setLoadingClient(false);
    }
  };

  const loadCases = async () => {
    try {
      setLoadingCases(true);

      const res = await getCases(id);

      setCases(res.data || []);
    } catch (err) {
      console.error("Error loading cases:", err);
    } finally {
      setLoadingCases(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";

    const date = new Date(dateStr);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getFileUrl = (path) => {
    const normalizedPath = path.replace(/\\/g, "/");

    return `${API_BASE}/${normalizedPath}`;
  };

  const handleViewCase = (caseId) => {
    navigate(`/clients/${id}/cases/${caseId}`);
  };

  const handleUploadFiles = async (e) => {
    try {
      const files = Array.from(e.target.files || []);

      if (files.length === 0) return;

      setUploadingFiles(true);

      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      await uploadClientDocuments(id, formData);

      await loadClient();

      e.target.value = "";
    } catch (err) {
      console.error("Error uploading files:", err);
      alert("Failed to upload files");
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleRemoveFile = async (fileName) => {
    try {
      await removeClientDocument(id, fileName);

      await loadClient();
    } catch (err) {
      console.error("Error removing file:", err);
      alert("Failed to remove file");
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveClient = async () => {
    try {
      setSavingClient(true);
      await updateClient(id, editForm);
      await loadClient();
      setEditingClient(false);
    } catch (err) {
      console.error("Error updating client:", err);
      alert("Failed to update client");
    } finally {
      setSavingClient(false);
    }
  };

  if (loadingClient) return <p>Loading client...</p>;

  if (!client) return <p>Client not found</p>;

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
        </div>
        <button className="btn-outline" onClick={() => setEditingClient((value) => !value)}>
          {editingClient ? "Cancel Edit" : "Edit Client"}
        </button>
      </div>

      {editingClient && (
        <div className="info-card client-edit-card">
          <div className="client-edit-grid">
            <input name="name" className="input" value={editForm.name} onChange={handleEditChange} />
            <input name="phone" className="input" value={editForm.phone} onChange={handleEditChange} />
            <select name="assigned_to" className="input" value={editForm.assigned_to} onChange={handleEditChange}>
              <option value="">Select Assigned To</option>
              {assignedToOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select name="assigned_from" className="input" value={editForm.assigned_from} onChange={handleEditChange}>
              <option value="">Select Assigned From</option>
              {assignedFromOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <textarea
            name="comment"
            className="input client-edit-comment"
            rows={3}
            value={editForm.comment}
            onChange={handleEditChange}
            placeholder="Comment"
          />
          <div className="form-actions">
            <button className="btn-secondary" onClick={() => setEditingClient(false)}>Cancel</button>
            <button className="btn" onClick={handleSaveClient} disabled={savingClient}>
              {savingClient ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Client Info */}
      <div className="info-card">

        <div className="client-info-row">

          <InfoItem label="Client ID" value={client.id} />

          <InfoItem label="Phone" value={client.phone} />

          <InfoItem
            label="Assigned To"
            value={client.assigned_to}
          />

          <InfoItem
            label="Assigned From"
            value={client.assigned_from}
          />

          <InfoItem
            label="Created"
            value={formatDate(client.created_at)}
          />

        </div>
      </div>

      <div className="info-card comment-card">
        <details>
          <summary>
            <span>Client Comment</span>
            <span className="comment-preview">{client.comment || "No comment added"}</span>
          </summary>
          <p>{client.comment || "No comment added for this client."}</p>
        </details>
      </div>

      {/* Client Documents */}
      <div className="info-card">

        <div className="section-header">
          <h3>Client Documents</h3>

          <button
            className="btn-outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFiles}
          >
            {uploadingFiles ? "Uploading..." : "+ Upload"}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={handleUploadFiles}
        />

        {Object.keys(client.files_info || {}).length === 0 ? (
          <p className="empty-text">
            No documents uploaded
          </p>
        ) : (
          <div className="files-list">

            {Object.entries(client.files_info || {}).map(
              ([fileName, fileInfo], idx) => (
                <div key={idx} className="compact-file-item">

                  {/* Left */}
                  <div className="file-info-row">

                    <span className="file-name">
                      {fileName}
                    </span>

                    <span className="file-date">
                      Uploaded on{" "}
                      {formatDate(fileInfo.uploaded_at)}
                    </span>

                  </div>

                  {/* Right */}
                  <div className="file-actions">

                    <a
                      href={getFileUrl(fileInfo.path)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-outline file-btn open-file-btn"
                    >
                      Open
                    </a>

                    <a
                      href={getFileUrl(fileInfo.path)}
                      download
                      className="btn-outline file-btn download-file-btn"
                    >
                      Download
                    </a>

                    <button
                      className="btn-outline remove-btn"
                      onClick={() =>
                        handleRemoveFile(fileName)
                      }
                    >
                      Remove
                    </button>

                  </div>

                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Cases */}
      <div className="info-card">

        <div className="cases-header">
          <div className="cases-title-row">
            <h3>Cases</h3>
            <span className="badge">
              {cases.length} total
            </span>
          </div>

          <button
            className="btn"
            onClick={() => navigate(`/clients/${client.id}/cases`)}
          >
            + Add Case
          </button>
        </div>

        {loadingCases ? (
          <p>Loading cases...</p>
        ) : cases.length === 0 ? (
          <div className="case-empty">

            <p>No cases yet. Add a case to get started.</p>
          </div>
        ) : (
          <div className="cases-table-container">

            <table className="cases-table">

              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Case Type</th>
                  <th>Folio Number</th>
                  <th>Company</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {cases.map((caseItem) => (
                  <tr key={caseItem.case_id}>

                    <td>{caseItem.case_id}</td>

                    <td>
                      <span
                        className={`case-type-badge case-type-${caseItem.case_type?.toLowerCase()}`}
                      >
                        {caseItem.case_type}
                      </span>
                    </td>

                    <td>{caseItem.folio_number}</td>

                    <td>{caseItem.company_name || caseItem.company || caseItem.company_id}</td>

                    <td>{formatDate(caseItem.created_at)}</td>

                    <td>
                      <span
                        className={`status-badge status-${(
                          caseItem.status || "fresh"
                        ).toLowerCase()}`}
                      >
                        {caseItem.status || "Fresh"}
                      </span>
                    </td>

                    <td>
                      <button
                        className="view-case-btn"
                        onClick={() =>
                          handleViewCase(caseItem.case_id)
                        }
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

function InfoItem({ label, value }) {
  return (
    <div className="info-item">

      <span className="info-label">
        {label}:
      </span>

      <span className="info-value">
        {value || "-"}
      </span>

    </div>
  );
}
