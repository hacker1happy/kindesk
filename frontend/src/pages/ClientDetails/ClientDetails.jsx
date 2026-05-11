import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteClient, getClientById, uploadClientDocuments, removeClientDocument, updateClient } from "../../api/clientApi";
import { getCases } from "../../api/caseApi";
import ConfirmationModal from "../../components/ConfirmationModal";

import "./ClientDetails.css";


const API_BASE = "http://127.0.0.1:8000";
const ALLOWED_UPLOAD_ACCEPT = ".pdf,.docx,.xlsx,.jpeg,.jpg,.png,.txt";
const OPS_ASSIGNMENT_LABEL = "Ops Owner";
const TELECALLER_LABEL = "Telecaller";
const FIELD_STAFF_OPTIONS = ["Hari", "Sachin", "Jayram"];

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const editModalRef = useRef(null);

  const [client, setClient] = useState(null);
  const [cases, setCases] = useState([]);

  const [loadingCases, setLoadingCases] = useState(false);
  const [loadingClient, setLoadingClient] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [commentExpanded, setCommentExpanded] = useState(false);
  const [editingClient, setEditingClient] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [pendingRemoveFile, setPendingRemoveFile] = useState(null);
  const [showDeleteClient, setShowDeleteClient] = useState(false);
  const [deleteClientInput, setDeleteClientInput] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    assigned_to: "",
    assigned_from: "",
    field_staff: "",
    partner_name: "",
    partner_company_name: "",
    partner_location: "",
    partner_phone: "",
    comment: "",
  });

  const assignedToOptions = ["Rohit", "Sangeeta", "Bandana", "Pari"];
  const assignedFromOptions = ["Pratha", "Richa", "Archana", "Gurmeen", "Dipesh"];

  const buildClientEditForm = (source) => ({
    name: source.name || "",
    phone: source.phone || "",
    assigned_to: source.assigned_to || "",
    assigned_from: source.assigned_from || "",
    field_staff: source.field_staff || "",
    partner_name: source.partner_name || "",
    partner_company_name: source.partner_company_name || "",
    partner_location: source.partner_location || "",
    partner_phone: source.partner_phone || "",
    comment: source.comment || "",
  });

  const loadClient = useCallback(async () => {
    try {
      setLoadingClient(true);

      const res = await getClientById(id);

      const nextClient = {
        id,
        ...res.data,
      };

      setClient(nextClient);
      setEditForm(buildClientEditForm(nextClient));
    } catch (err) {
      console.error("Error loading client:", err);
    } finally {
      setLoadingClient(false);
    }
  }, [id]);

  const loadCases = useCallback(async () => {
    try {
      setLoadingCases(true);

      const res = await getCases(id);

      setCases(res.data || []);
    } catch (err) {
      console.error("Error loading cases:", err);
    } finally {
      setLoadingCases(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadClient();
      loadCases();
    }
  }, [id, loadCases, loadClient]);

  useEffect(() => {
    if (!editingClient) return;

    const firstField = editModalRef.current?.querySelector("input, textarea, select, button:not(:disabled)");
    window.requestAnimationFrame(() => firstField?.focus());
  }, [editingClient]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";

    const date = new Date(dateStr);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getClientDocumentUrl = (fileName, fileInfo = {}) => {
    const storedPath = fileInfo.path || `data/uploads/${id}/${fileName}`;
    const normalizedPath = String(storedPath).replace(/\\/g, "/").replace(/^\/+/, "");
    const encodedPath = normalizedPath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    return `${API_BASE}/${encodedPath}`;
  };

  const getSortedFiles = () => {
    return Object.entries(client.files_info || {}).sort(([, a], [, b]) => {
      return new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0);
    });
  };

  const getStatusClass = (status = "fresh") => {
    const normalizedStatus = status.toLowerCase();

    if (/^q\d+_/.test(normalizedStatus)) return "query";

    return normalizedStatus;
  };

  const openEditModal = () => {
    setEditForm(buildClientEditForm(client));
    setEditingClient(true);
  };

  const closeEditModal = () => {
    if (savingClient) return;
    setEditingClient(false);
  };

  const handleOpenFile = (fileName, fileInfo) => {
    window.open(getClientDocumentUrl(fileName, fileInfo), "_blank", "noopener,noreferrer");
  };

  const handleDownloadFile = async (fileName, fileInfo) => {
    try {
      const response = await fetch(getClientDocumentUrl(fileName, fileInfo));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download file");
    }
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
      alert(err.response?.data?.detail || "Failed to upload files");
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleRemoveFile = async () => {
    if (!pendingRemoveFile) return;
    try {
      await removeClientDocument(id, pendingRemoveFile);

      await loadClient();
      setPendingRemoveFile(null);
    } catch (err) {
      console.error("Error removing file:", err);
      alert("Failed to remove file");
    }
  };

  const handleDeleteClient = async () => {
    try {
      await deleteClient(id, deleteClientInput);
      navigate("/");
    } catch (err) {
      console.error("Error deleting client:", err);
      alert(err.response?.data?.detail || "Failed to delete client");
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === "name") {
      nextValue = value.replace(/[^A-Za-z ]/g, "");
    }

    if (name === "phone" || name === "partner_phone") {
      let digits = value.replace(/\D/g, "");
      if (digits.startsWith("91")) digits = digits.slice(2);
      digits = digits.slice(0, 10);
      nextValue = digits ? `+91${digits}` : "";
      if (name === "phone" && !digits) nextValue = "+91";
    }

    setEditForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  };

  const handleSaveClient = async () => {
    if (!editForm.assigned_to.trim()) return;

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

  const handleEditModalKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeEditModal();
    }

    if (event.key === "Enter" && event.target.tagName?.toLowerCase() !== "textarea") {
      event.preventDefault();
      handleSaveClient();
    }
  };

  if (loadingClient) return <p>Loading client...</p>;

  if (!client) return <p>Client not found</p>;

  const editErrors = {
    assigned_to: editForm.assigned_to.trim() ? "" : "Select an Ops Owner before saving.",
  };
  const canSaveClient = !editErrors.assigned_to && !savingClient;
  const ownerOptions = [...new Set([editForm.assigned_to, client.assigned_to, ...assignedToOptions].filter(Boolean))];
  const leadSources = [
    client.assigned_from && {
      type: "Telecaller Details",
      primary: client.assigned_from,
      details: "Lead source",
    },
    client.field_staff && {
      type: "Field Staff Details",
      primary: client.field_staff,
      details: "Field referral",
    },
    (client.partner_name || client.partner_company_name || client.partner_location || client.partner_phone) && {
      type: "Partner Details",
      primary: client.partner_name || client.partner_company_name || client.partner_phone,
      details: [
        client.partner_company_name,
        client.partner_location,
        client.partner_phone,
      ].filter(Boolean).join(" | "),
    },
  ].filter(Boolean);
  const comment = client.comment || "";
  const shouldCollapseComment = comment.length > 160 || comment.includes("\n");
  const visibleComment =
    shouldCollapseComment && !commentExpanded
      ? `${comment.slice(0, 160)}${comment.length > 160 ? "..." : ""}`
      : comment;

  return (
    <div className="container">

      {/* Back */}
      <div className="back-link" onClick={() => navigate("/")}>
        &larr; Back to Dashboard
      </div>

      {/* Header */}
      <div className="details-header">
        <div>
          <h2>{client.name}</h2>
        </div>
        <div className="details-header-actions">
          <button className="btn-outline" onClick={openEditModal}>
            Edit Client
          </button>
          <button className="btn-outline remove-btn" onClick={() => setShowDeleteClient(true)}>
            Delete Client
          </button>
        </div>
      </div>

      {editingClient && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeEditModal}>
          <div
            className="client-edit-modal"
            ref={editModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-edit-title"
            tabIndex={-1}
            onKeyDown={handleEditModalKeyDown}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="client-edit-modal-header">
              <div>
                <h3 id="client-edit-title">Edit Client Details</h3>
                <p>Update contact, assignment, and notes for this client.</p>
              </div>
            </div>

            <div className="client-edit-grid">
              <label>
                <span>Client Name</span>
                <input name="name" className="input" value={editForm.name} onChange={handleEditChange} />
              </label>
              <label>
                <span>Phone</span>
                <input name="phone" className="input" value={editForm.phone} onChange={handleEditChange} />
              </label>
              <label>
                <span>{TELECALLER_LABEL}</span>
                <select name="assigned_from" className="input" value={editForm.assigned_from} onChange={handleEditChange}>
                  <option value="">Select {TELECALLER_LABEL}</option>
                  {assignedFromOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Field Staff</span>
                <select name="field_staff" className="input" value={editForm.field_staff} onChange={handleEditChange}>
                  <option value="">Select Field Staff</option>
                  {FIELD_STAFF_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>{OPS_ASSIGNMENT_LABEL}</span>
                <select name="assigned_to" className="input" value={editForm.assigned_to} onChange={handleEditChange}>
                  <option value="">Select {OPS_ASSIGNMENT_LABEL}</option>
                  {ownerOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {editErrors.assigned_to && <p className="error">{editErrors.assigned_to}</p>}
              </label>
            </div>

            <div className="client-edit-section">
              <div className="client-edit-subtitle">Partner Details</div>
              <div className="client-edit-grid">
                <label>
                  <span>Partner Name</span>
                  <input name="partner_name" className="input" value={editForm.partner_name} onChange={handleEditChange} />
                </label>
                <label>
                  <span>Company Name</span>
                  <input name="partner_company_name" className="input" value={editForm.partner_company_name} onChange={handleEditChange} />
                </label>
                <label>
                  <span>Address / Location</span>
                  <input name="partner_location" className="input" value={editForm.partner_location} onChange={handleEditChange} />
                </label>
                <label>
                  <span>Phone Number</span>
                  <input name="partner_phone" className="input" value={editForm.partner_phone} onChange={handleEditChange} />
                </label>
              </div>
            </div>

            <label className="client-edit-comment-field">
              <span>Comment</span>
              <textarea
                name="comment"
                className="input client-edit-comment"
                rows={8}
                value={editForm.comment}
                onChange={handleEditChange}
                placeholder="Comment"
              />
            </label>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeEditModal} disabled={savingClient}>Cancel</button>
              <button className="btn" onClick={handleSaveClient} disabled={!canSaveClient}>
                {savingClient ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Info */}
      <section className="info-card client-summary-card">
        <div className="client-primary-grid">
          <InfoItem label="Client ID" value={client.id} />
          <InfoItem label="Phone Number" value={client.phone} />
          <InfoItem label="Ops Team Member" value={client.assigned_to} />
          <InfoItem label="Created Date" value={formatDate(client.created_at)} />
        </div>

        {leadSources.length > 0 && (
          <div className="lead-source-panel">
            <div className="lead-source-title">Lead Source Information</div>
            <div className="lead-source-table">
              {leadSources.map((source) => (
                <div className="lead-source-row" key={source.type}>
                  <span>{source.type}</span>
                  <strong>{source.primary}</strong>
                  {source.details && <em>{source.details}</em>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="info-card comment-card">
        <div className="comment-header">
          <span>Client Comment</span>
          {shouldCollapseComment && (
            <button className="comment-toggle" onClick={() => setCommentExpanded((value) => !value)}>
              {commentExpanded ? "View Less" : "View More"}
            </button>
          )}
        </div>
        <p className={commentExpanded ? "comment-text expanded" : "comment-text"}>
          {visibleComment || "No comment added for this client."}
        </p>
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
          accept={ALLOWED_UPLOAD_ACCEPT}
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

            {getSortedFiles().map(
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

                    <button
                      type="button"
                      className="btn-outline file-btn open-file-btn"
                      onClick={() => handleOpenFile(fileName, fileInfo)}
                    >
                      Open
                    </button>

                    <button
                      type="button"
                      className="btn-outline file-btn download-file-btn"
                      onClick={() => handleDownloadFile(fileName, fileInfo)}
                    >
                      Download
                    </button>

                    <button
                      className="btn-outline remove-btn"
                      onClick={() =>
                        setPendingRemoveFile(fileName)
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
                        className={`status-badge status-${getStatusClass(caseItem.status)}`}
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

      {pendingRemoveFile && (
        <ConfirmationModal
          title="Remove document?"
          message={`You are removing "${pendingRemoveFile}".`}
          detail="This action is irreversible and the file will be removed from this client."
          confirmLabel="Confirm Remove"
          danger
          onCancel={() => setPendingRemoveFile(null)}
          onConfirm={handleRemoveFile}
        />
      )}

      {showDeleteClient && (
        <ConfirmationModal
          title="Delete client?"
          message={`This will permanently delete client ${client.name || "-"} (${client.id}).`}
          detail="Uploaded files and all linked cases will also be removed. Type the Client ID exactly to confirm this irreversible action."
          confirmLabel="Delete Client"
          danger
          confirmDisabled={deleteClientInput !== client.id}
          onCancel={() => {
            setShowDeleteClient(false);
            setDeleteClientInput("");
          }}
          onConfirm={handleDeleteClient}
        >
          <div className="confirm-id-input">
            <label>
              Client ID
              <input
                className="input"
                value={deleteClientInput}
                onChange={(event) => setDeleteClientInput(event.target.value)}
                placeholder={client.id}
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

      <span className="info-label">
        {label}:
      </span>

      <span className="info-value">
        {value || "-"}
      </span>

    </div>
  );
}
