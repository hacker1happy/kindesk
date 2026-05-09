import { useEffect, useMemo, useState } from "react";
import {
  addQuery,
  decideEVerification,
  revertStage,
  resolveQuery,
  submitOpsReviewForm,
  updateQuery,
  updateStage,
  uploadQueryDocument,
  uploadStageDocument,
} from "../../../api/caseApi";

const QUERY_AFTER_STAGE = "sent_to_rta";
const IEPF_WORKFLOW_STAGES = new Set(["iepf_generated", "iepf_submitted", "everification"]);
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
const STAGES_WITHOUT_UPLOAD = new Set([
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
const REQUIRED_DOCUMENT_TYPES = {
  sent_to_rta: [
    { key: "document_sent_to_company_rta", label: "Document sent to Company/RTA" },
    { key: "pod_receipt", label: "POD receipt" },
  ],
  iepf_submitted: [
    { key: "document_sent_to_company_rta", label: "Document sent to Company/RTA" },
    { key: "pod_receipt", label: "POD receipt" },
  ],
};
const ALLOWED_UPLOAD_ACCEPT = ".pdf,.docx,.xlsx,.jpeg,.jpg,.png,.txt";
const OPS_REVIEW_QUESTIONS = [
  { key: "documents_verified", label: "All required client documents verified" },
  { key: "case_details_matched", label: "Case details match company and folio records" },
  { key: "rta_packet_ready", label: "RTA submission packet is ready" },
  { key: "exceptions_recorded", label: "Exceptions or special notes are recorded" },
];

export default function CaseStatus({ caseData, clientId, refresh }) {
  const [loadingKey, setLoadingKey] = useState(null);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [queryDetails, setQueryDetails] = useState("");
  const [viewingQuery, setViewingQuery] = useState(null);
  const [opsFormOpen, setOpsFormOpen] = useState(false);
  const [opsFormReadOnly, setOpsFormReadOnly] = useState(false);
  const [opsAnswers, setOpsAnswers] = useState(() => buildEmptyOpsAnswers());
  const [everificationComment, setEverificationComment] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [revertCandidate, setRevertCandidate] = useState(null);
  const [resolveCandidate, setResolveCandidate] = useState(null);
  const [resolutionRemarks, setResolutionRemarks] = useState("");
  const [editQueryMode, setEditQueryMode] = useState(false);
  const [editQueryForm, setEditQueryForm] = useState(buildEmptyQueryEditForm());
  const [queryPanelOpen, setQueryPanelOpen] = useState(false);

  const stages = useMemo(() => caseData.stages || [], [caseData.stages]);
  const queries = caseData.queries || [];
  const sentToRtaStage = stages.find((stage) => stage.key === QUERY_AFTER_STAGE);
  const locCompleted = isCompleted(stages, "loc_received");
  const loeCompleted = isCompleted(stages, "loe_received");
  const hasOpenQuery = queries.some((query) => query.status === "open");
  const canManageQueries = sentToRtaStage?.completed && !locCompleted && !loeCompleted;
  const canAddQuery = canManageQueries && !hasOpenQuery;
  const visibleStages = useMemo(
    () => getVisibleStages(stages, locCompleted, loeCompleted),
    [stages, locCompleted, loeCompleted]
  );
  const actionableStages = useMemo(() => getActionableStages(visibleStages, stages), [visibleStages, stages]);
  const latestCompletedStageKey = [...actionableStages].reverse().find((stage) => stage.completed)?.key || null;
  const modalOpen = Boolean(
    showQueryModal ||
      viewingQuery ||
      resolveCandidate ||
      opsFormOpen ||
      showCloseModal ||
      showRejectModal ||
      revertCandidate
  );

  useEffect(() => {
    if (!modalOpen) return;

    window.requestAnimationFrame(() => {
      const modal = document.querySelector(".modal-backdrop .query-modal");
      const focusable = modal?.querySelector(
        "textarea, input, select, button:not(:disabled), [href], [tabindex]:not([tabindex='-1'])"
      );
      focusable?.focus();
    });
  }, [modalOpen]);

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

  const refreshAfter = async (work) => {
    await work();
    await refresh();
  };

  const handleStageComplete = async (stageKey, payload = {}) => {
    try {
      setLoadingKey(stageKey);
      await refreshAfter(() => updateStage(clientId, caseData.case_id, stageKey, payload));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to update stage");
    } finally {
      setLoadingKey(null);
    }
  };

  const performStageRevert = async (stage) => {
    if (!stage) return;

    try {
      setLoadingKey(`${stage.key}-revert`);
      await refreshAfter(() => revertStage(clientId, caseData.case_id, stage.key));
      setRevertCandidate(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to revert stage");
    } finally {
      setLoadingKey(null);
    }
  };

  const handleRequestStageRevert = (stage) => {
    if (getRevertConsequences(stage, caseData).length > 0) {
      setRevertCandidate(stage);
      return;
    }

    performStageRevert(stage);
  };

  const handleStageUpload = async (stageKey, selectedFiles, documentType = "") => {
    try {
      if (!selectedFiles?.length) return;

      setLoadingKey(`${stageKey}-${documentType || "upload"}`);
      const formData = new FormData();
      if (documentType) formData.append("document_type", documentType);
      Array.from(selectedFiles).forEach((file) => formData.append("files", file));

      await refreshAfter(() => uploadStageDocument(clientId, caseData.case_id, stageKey, formData));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to upload stage document");
    } finally {
      setLoadingKey(null);
    }
  };

  const handleOpenOpsForm = (stage, readOnly = false) => {
    setOpsFormReadOnly(readOnly);
    setOpsAnswers(stage.ops_review_form ? buildOpsAnswersFromStage(stage) : buildEmptyOpsAnswers());
    setOpsFormOpen(true);
  };

  const handleSubmitOpsForm = async (draft = false) => {
    try {
      setLoadingKey("ops_review-form");
      await refreshAfter(() => submitOpsReviewForm(clientId, caseData.case_id, { answers: opsAnswers, draft }));
      if (!draft) setOpsFormOpen(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to submit Ops review form");
    } finally {
      setLoadingKey(null);
    }
  };

  const handleCloseCase = async () => {
    await handleStageComplete("closed", { reason: closeReason });
    setCloseReason("");
    setShowCloseModal(false);
  };

  const handleRequestClose = () => {
    if (isCompleted(stages, "shares_credited")) {
      handleStageComplete("closed");
      return;
    }

    setShowCloseModal(true);
  };

  const handleEverificationDecision = async (decision) => {
    try {
      setLoadingKey(`everification-${decision}`);
      await refreshAfter(() =>
        decideEVerification(clientId, caseData.case_id, {
          decision,
          comment: everificationComment,
        })
      );
      setEverificationComment("");
      setShowRejectModal(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to update E-Verification");
    } finally {
      setLoadingKey(null);
    }
  };

  const handleAddQuery = async () => {
    try {
      setLoadingKey("add-query");
      await refreshAfter(() => addQuery(clientId, caseData.case_id, { details: queryDetails }));
      setQueryDetails("");
      setShowQueryModal(false);
      setQueryPanelOpen(true);
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

      await refreshAfter(() => uploadQueryDocument(clientId, caseData.case_id, queryNo, formData));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to upload query document");
    } finally {
      setLoadingKey(null);
    }
  };

  const handleOpenResolveQuery = (query) => {
    setResolveCandidate(query);
    setResolutionRemarks(query.resolution_details || "");
  };

  const handleResolveQuery = async () => {
    if (!resolveCandidate) return;

    try {
      setLoadingKey(`query-${resolveCandidate.query_no}-close`);
      await refreshAfter(() =>
        resolveQuery(clientId, caseData.case_id, resolveCandidate.query_no, {
          resolution_details: resolutionRemarks,
        })
      );
      setResolveCandidate(null);
      setResolutionRemarks("");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to close query");
    } finally {
      setLoadingKey(null);
    }
  };

  const handleViewQueryDetails = (query) => {
    setViewingQuery(query);
    setEditQueryMode(false);
    setEditQueryForm(buildQueryEditForm(query));
  };

  const handleSaveQueryDetails = async () => {
    if (!viewingQuery) return;

    try {
      setLoadingKey(`query-${viewingQuery.query_no}-update`);
      await refreshAfter(() => updateQuery(clientId, caseData.case_id, viewingQuery.query_no, editQueryForm));
      setViewingQuery({ ...viewingQuery, ...editQueryForm });
      setEditQueryMode(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to update query");
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <section className="info-card case-progress-card">
      <div className="section-header">
        <h3>Case Stages</h3>
      </div>

      <div className="stage-list">
        {visibleStages.map((stage, index) => {
          const previousStagesComplete = visibleStages
            .slice(0, index)
            .filter((previousStage) => !(stage.key === "loe_received" && previousStage.key === "loc_received"))
            .every((previousStage) => previousStage.completed);

          return (
            <div key={stage.key}>
              <StageRow
                stage={stage}
                loadingKey={loadingKey}
                canComplete={previousStagesComplete}
                formatDateTime={formatDateTime}
                locCompleted={locCompleted}
                loeCompleted={loeCompleted}
                onUpload={handleStageUpload}
                onComplete={handleStageComplete}
                onRequestClose={handleRequestClose}
                onRequestEverificationReject={() => setShowRejectModal(true)}
                onOpenOpsForm={handleOpenOpsForm}
                onEverificationDecision={handleEverificationDecision}
                everificationRejectDisabled={isNextStageCompleted(actionableStages, stage.key)}
                canRevert={stage.key === latestCompletedStageKey}
                onRevert={handleRequestStageRevert}
              />

              {stage.key === QUERY_AFTER_STAGE && (canManageQueries || queries.length > 0) && (
                <div className="query-panel">
                  <button
                    type="button"
                    className="query-panel-toggle"
                    aria-expanded={queryPanelOpen}
                    onClick={() => setQueryPanelOpen((open) => !open)}
                  >
                    <span>
                      <span className="query-panel-icon">{queryPanelOpen ? "-" : "+"}</span>
                      Company/RTA queries
                    </span>
                    <span className="query-panel-meta">
                      {queries.length} {queries.length === 1 ? "query" : "queries"}
                    </span>
                  </button>

                  {queryPanelOpen && (
                    <div className="query-panel-body">
                      <div className="query-panel-toolbar">
                        <span className={hasOpenQuery ? "query-state open" : "query-state"}>
                          {hasOpenQuery ? "Open query active" : "No open query"}
                        </span>
                        {canManageQueries && (
                          <button
                            className="btn-outline"
                            onClick={() => setShowQueryModal(true)}
                            disabled={!canAddQuery || loadingKey === "add-query"}
                            title={hasOpenQuery ? "Resolve the open query before adding another." : ""}
                          >
                            + Add Query
                          </button>
                        )}
                      </div>

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
                              onResolve={handleOpenResolveQuery}
                              onViewDetails={handleViewQueryDetails}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {stage.key === "loe_received" && (
                <div className="nested-stage-list">
                  {getLoeChildStages(stages).map((childStage, childIndex, childStages) => {
                    const previousChildStagesComplete = childStages
                      .slice(0, childIndex)
                      .every((previousStage) => previousStage.completed);

                    return (
                      <StageRow
                        key={childStage.key}
                        stage={childStage}
                        loadingKey={loadingKey}
                        canComplete={stage.completed && previousChildStagesComplete}
                        formatDateTime={formatDateTime}
                        locCompleted={locCompleted}
                        loeCompleted={loeCompleted}
                        onUpload={handleStageUpload}
                        onComplete={handleStageComplete}
                        onRequestClose={handleRequestClose}
                        onRequestEverificationReject={() => setShowRejectModal(true)}
                        onOpenOpsForm={handleOpenOpsForm}
                        onEverificationDecision={handleEverificationDecision}
                        everificationRejectDisabled={isNextStageCompleted(actionableStages, childStage.key)}
                        canRevert={childStage.key === latestCompletedStageKey}
                        onRevert={handleRequestStageRevert}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showQueryModal && (
        <div className="modal-backdrop">
          <div className="query-modal">
            <h3>Add Query</h3>
            <textarea
              value={queryDetails}
              maxLength={1000}
              rows={6}
              placeholder="Enter query details or reason"
              onChange={(e) => setQueryDetails(e.target.value)}
            />
            <div className="modal-meta">{queryDetails.length}/1000</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowQueryModal(false)}>
                Cancel
              </button>
              <button className="btn" disabled={!queryDetails.trim() || loadingKey === "add-query"} onClick={handleAddQuery}>
                Add Query
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingQuery && (
        <div className="modal-backdrop">
          <div className="query-modal">
            <h3>Query {viewingQuery.query_no} Details</h3>
            {editQueryMode ? (
              <div className="query-edit-form">
                <label>
                  Query description
                  <textarea
                    value={editQueryForm.details}
                    maxLength={1000}
                    rows={4}
                    onChange={(event) => setEditQueryForm({ ...editQueryForm, details: event.target.value })}
                  />
                </label>
                <label>
                  Resolution remarks
                  <textarea
                    value={editQueryForm.resolution_details}
                    maxLength={1000}
                    rows={3}
                    onChange={(event) => setEditQueryForm({ ...editQueryForm, resolution_details: event.target.value })}
                  />
                </label>
              </div>
            ) : (
              <div className="query-detail-stack">
                <QueryDetailBlock title="Description" value={viewingQuery.details} />
                <QueryDetailBlock title="Resolution remarks" value={viewingQuery.resolution_details} />
              </div>
            )}
            <div className="modal-actions">
              {editQueryMode ? (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setEditQueryMode(false);
                      setEditQueryForm(buildQueryEditForm(viewingQuery));
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn"
                    disabled={!editQueryForm.details.trim() || loadingKey === `query-${viewingQuery.query_no}-update`}
                    onClick={handleSaveQueryDetails}
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-outline" onClick={() => setEditQueryMode(true)}>
                    Edit
                  </button>
                  <button className="btn" onClick={() => setViewingQuery(null)}>Close</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {resolveCandidate && (
        <div className="modal-backdrop">
          <div className="query-modal">
            <h3>Resolve Query {resolveCandidate.query_no}</h3>
            <label className="modal-field">
              Resolution remarks
              <textarea
                value={resolutionRemarks}
                maxLength={1000}
                rows={4}
                placeholder="Add remarks or details for audit tracking"
                onChange={(event) => setResolutionRemarks(event.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setResolveCandidate(null)}>
                Cancel
              </button>
              <button
                className="btn"
                disabled={
                  !resolutionRemarks.trim() ||
                  loadingKey === `query-${resolveCandidate.query_no}-close`
                }
                onClick={handleResolveQuery}
              >
                Resolve Query
              </button>
            </div>
          </div>
        </div>
      )}

      {opsFormOpen && (
        <OpsReviewModal
          answers={opsAnswers}
          readOnly={opsFormReadOnly}
          loading={loadingKey === "ops_review-form"}
          onAnswersChange={setOpsAnswers}
          onCancel={() => setOpsFormOpen(false)}
          onSubmit={handleSubmitOpsForm}
        />
      )}

      {showCloseModal && (
        <div className="modal-backdrop">
          <div className="query-modal">
            <h3>Close Case</h3>
            <textarea
              value={closeReason}
              maxLength={1000}
              rows={5}
              placeholder="Enter the reason for closing this case"
              onChange={(event) => setCloseReason(event.target.value)}
            />
            <div className="modal-meta">{closeReason.length}/1000</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCloseModal(false)}>
                Cancel
              </button>
              <button
                className="btn"
                disabled={!closeReason.trim() || loadingKey === "closed"}
                onClick={handleCloseCase}
              >
                Close Case
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="modal-backdrop">
          <div className="query-modal">
            <h3>Reject E-Verification Comment</h3>
            <textarea
              value={everificationComment}
              maxLength={1000}
              rows={5}
              placeholder="Enter rejection comment"
              onChange={(event) => setEverificationComment(event.target.value)}
            />
            <div className="modal-meta">{everificationComment.length}/1000</div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowRejectModal(false);
                  setEverificationComment("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn-outline remove-btn"
                disabled={!everificationComment.trim() || loadingKey === "everification-rejected"}
                onClick={() => handleEverificationDecision("rejected")}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {revertCandidate && (
        <div className="modal-backdrop">
          <div className="query-modal">
            <h3>Revert {revertCandidate.label}?</h3>
            <p className="query-detail-text">
              Reverting this stage will return it to pending and show the normal Mark as done action again.
            </p>
            <ul className="revert-warning-list">
              {getRevertConsequences(revertCandidate, caseData).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setRevertCandidate(null)}>
                Cancel
              </button>
              <button
                className="btn-outline remove-btn"
                disabled={loadingKey === `${revertCandidate.key}-revert`}
                onClick={() => performStageRevert(revertCandidate)}
              >
                Confirm Revert
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StageRow({
  stage,
  loadingKey,
  canComplete,
  formatDateTime,
  locCompleted,
  loeCompleted,
  onUpload,
  onComplete,
  onRequestClose,
  onRequestEverificationReject,
  onOpenOpsForm,
  onEverificationDecision,
  everificationRejectDisabled,
  canRevert,
  onRevert,
}) {
  const documents = stage.documents || [];
  const latestDocument = [...documents].sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0))[0];
  const requiredDocumentTypes = REQUIRED_DOCUMENT_TYPES[stage.key] || [];
  const missingRequiredTypes = requiredDocumentTypes.filter(
    (type) => !documents.some((document) => document.document_type === type.key)
  );
  const requiresDocument = !OPTIONAL_DOCUMENT_STAGES.has(stage.key);
  const missingRequiredDocument =
    missingRequiredTypes.length > 0 || (requiresDocument && documents.length === 0);
  const isBranchLocked =
    (stage.key === "loc_received" && loeCompleted) || (stage.key === "loe_received" && locCompleted);
  const requiresOpsForm = stage.key === "ops_review";
  const requiresEverificationDecision = stage.key === "everification";
  const isCloseStage = stage.key === "closed";
  const canUseCompleteButton = !requiresOpsForm && !requiresEverificationDecision;
  const showUploadControls = !STAGES_WITHOUT_UPLOAD.has(stage.key);

  return (
    <div className={`stage-row stage-${stage.key} ${stage.completed ? "completed" : ""}`}>
      <div className="stage-main">
        <span className="stage-status-dot" />
        <div>
          <strong>{stage.label}</strong>
          <p>
            {documents.length} doc{documents.length === 1 ? "" : "s"}
            {latestDocument ? `, latest ${formatDateTime(latestDocument.uploaded_at)}` : ""}
            {stage.ops_review_form ? `, form submitted ${formatDateTime(stage.ops_review_form.submitted_at)}` : ""}
            {stage.approval_status ? `, ${stage.approval_status}` : ""}
          </p>
        </div>
      </div>

      <div className="stage-actions-wrap">
        {showUploadControls && requiredDocumentTypes.length > 0 ? (
          <RequiredUploadControls
            stageKey={stage.key}
            documentTypes={requiredDocumentTypes}
            documents={documents}
            loadingKey={loadingKey}
            onUpload={onUpload}
          />
        ) : showUploadControls ? (
          <label className="btn-outline compact-upload">
            Upload
            <input
              type="file"
              multiple
              accept={ALLOWED_UPLOAD_ACCEPT}
              hidden
              onChange={(e) => onUpload(stage.key, e.target.files)}
            />
          </label>
        ) : null}

        {requiresOpsForm && (
          <>
            <button
              className="btn-outline"
              disabled={!canComplete || stage.completed || loadingKey === "ops_review-form"}
              title={!canComplete ? "Complete previous stage first." : ""}
              onClick={() => onOpenOpsForm(stage, false)}
            >
              {stage.completed ? "Submitted" : "Fill Form"}
            </button>
            {stage.ops_review_form && (
              <button className="btn-outline" onClick={() => onOpenOpsForm(stage, true)}>
                View Form
              </button>
            )}
          </>
        )}

        {requiresEverificationDecision && (
          <div className="everification-controls">
            <button
              className="btn-outline download-file-btn"
              disabled={!canComplete || stage.completed || loadingKey === "everification-approved"}
              onClick={() => onEverificationDecision("approved")}
            >
              Approve
            </button>
            <button
              className="btn-outline remove-btn"
              disabled={!canComplete || everificationRejectDisabled || loadingKey === "everification-rejected"}
              title={everificationRejectDisabled ? "Revert the next completed stage before rejecting." : ""}
              onClick={onRequestEverificationReject}
            >
              Reject
            </button>
          </div>
        )}

        {canUseCompleteButton && (
          <button
            className="btn-outline"
            disabled={
              loadingKey === stage.key ||
              loadingKey === `${stage.key}-revert` ||
              (stage.completed && !canRevert) ||
              (!isCloseStage && !canComplete) ||
              (!stage.completed && missingRequiredDocument) ||
              isBranchLocked
            }
            title={
              !isCloseStage && !canComplete
                ? "Complete previous stage first."
                : isBranchLocked
                  ? "The other workflow branch is already selected."
                  : missingRequiredDocument
                    ? "Upload required document before marking this stage done."
                    : ""
            }
            onClick={() => (stage.completed ? onRevert(stage) : isCloseStage ? onRequestClose() : onComplete(stage.key))}
          >
            {stage.completed ? (canRevert ? "Revert" : "Done") : isCloseStage ? "Close Case" : "Mark as done"}
          </button>
        )}

        {!canUseCompleteButton && stage.completed && (
          <button
            className="btn-outline"
            disabled={!canRevert || loadingKey === `${stage.key}-revert`}
            onClick={() => onRevert(stage)}
          >
            {canRevert ? "Revert" : "Done"}
          </button>
        )}
      </div>
    </div>
  );
}

function RequiredUploadControls({ stageKey, documentTypes, documents, loadingKey, onUpload }) {
  return (
    <div className="required-upload-controls">
      {documentTypes.map((documentType) => {
        const hasDocument = documents.some((document) => document.document_type === documentType.key);

        return (
          <label key={documentType.key} className={`btn-outline compact-upload ${hasDocument ? "uploaded" : ""}`}>
            {hasDocument ? `Add ${documentType.label}` : documentType.label}
            <input
              type="file"
              accept={ALLOWED_UPLOAD_ACCEPT}
              hidden
              onChange={(e) => onUpload(stageKey, e.target.files, documentType.key)}
              disabled={loadingKey === `${stageKey}-${documentType.key}`}
            />
          </label>
        );
      })}
    </div>
  );
}

function OpsReviewModal({ answers, readOnly, loading, onAnswersChange, onCancel, onSubmit }) {
  const isComplete = OPS_REVIEW_QUESTIONS.every((question) => answers[question.key]?.answer);

  const updateAnswer = (questionKey, patch) => {
    onAnswersChange({
      ...answers,
      [questionKey]: {
        ...answers[questionKey],
        ...patch,
      },
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="query-modal ops-review-modal">
        <h3>{readOnly ? "Ops Review Form" : "Ops Review & Sign-off"}</h3>

        <div className="ops-question-list">
          {OPS_REVIEW_QUESTIONS.map((question) => (
            <div className="ops-question" key={question.key}>
              <strong>{question.label}</strong>
              <div className="segmented-control">
                <button
                  className={answers[question.key]?.answer === "yes" ? "active" : ""}
                  disabled={readOnly}
                  onClick={() => updateAnswer(question.key, { answer: "yes" })}
                >
                  Yes
                </button>
                <button
                  className={answers[question.key]?.answer === "no" ? "active" : ""}
                  disabled={readOnly}
                  onClick={() => updateAnswer(question.key, { answer: "no" })}
                >
                  No
                </button>
              </div>
              <textarea
                rows={2}
                value={answers[question.key]?.comment || ""}
                placeholder="Comment"
                disabled={readOnly}
                onChange={(event) => updateAnswer(question.key, { comment: event.target.value })}
              />
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>
            {readOnly ? "Close" : "Cancel"}
          </button>
          {!readOnly && (
            <>
              <button className="btn-outline" disabled={loading} onClick={() => onSubmit(true)}>
                Save Draft
              </button>
              <button className="btn" disabled={!isComplete || loading} onClick={() => onSubmit(false)}>
                Submit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function QueryRow({ query, loadingKey, formatDateTime, onUpload, onResolve, onViewDetails }) {
  const documents = query.documents || [];
  const latestDocument = [...documents].sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0))[0];
  const isClosed = query.status === "closed";

  return (
    <div className={`query-row stage-query ${isClosed ? "completed" : ""}`}>
      <div className="stage-main">
        <span className="query-status-dot" />
        <div>
          <strong>Query {query.query_no}</strong>
          <p>
            {isClosed ? "Closed" : "Open"} - {documents.length} doc{documents.length === 1 ? "" : "s"}
            {latestDocument ? `, latest ${formatDateTime(latestDocument.uploaded_at)}` : ""}
          </p>
        </div>
      </div>

      <div className="stage-actions">
        <label className="btn-outline compact-upload">
          Upload
          <input
            type="file"
            accept={ALLOWED_UPLOAD_ACCEPT}
            hidden
            onChange={(e) => onUpload(query.query_no, e.target.files?.[0])}
          />
        </label>
        <button className="btn-outline" onClick={() => onViewDetails(query)}>
          View Details
        </button>
        <button
          className="btn-outline"
          disabled={isClosed || loadingKey === `query-${query.query_no}-close`}
          onClick={() => onResolve(query)}
        >
          {isClosed ? "Resolved" : "Resolve"}
        </button>
      </div>
    </div>
  );
}

function isCompleted(stages, stageKey) {
  return Boolean(stages.find((stage) => stage.key === stageKey)?.completed);
}

function getVisibleStages(stages, locCompleted, loeCompleted) {
  if (locCompleted) {
    return stages.filter((stage) => stage.key !== "loe_received" && !IEPF_WORKFLOW_STAGES.has(stage.key));
  }

  if (loeCompleted) {
    return stages.filter((stage) => stage.key !== "loc_received" && !IEPF_WORKFLOW_STAGES.has(stage.key));
  }

  return stages.filter((stage) => !IEPF_WORKFLOW_STAGES.has(stage.key));
}

function getLoeChildStages(stages) {
  return stages.filter((stage) => IEPF_WORKFLOW_STAGES.has(stage.key));
}

function getActionableStages(visibleStages, stages) {
  return visibleStages.flatMap((stage) => {
    if (stage.key === "loe_received") {
      return [stage, ...getLoeChildStages(stages)];
    }

    return [stage];
  });
}

function isNextStageCompleted(actionableStages, stageKey) {
  const stageIndex = actionableStages.findIndex((stage) => stage.key === stageKey);
  return stageIndex >= 0 && Boolean(actionableStages[stageIndex + 1]?.completed);
}

function getRevertConsequences(stage, caseData) {
  const consequences = [];

  if ((stage.documents || []).length > 0) {
    consequences.push("Uploaded or generated documents related to this stage will be deleted.");
  }
  if (stage.ops_review_form) {
    consequences.push("The filled Ops Review form for this stage will be reset.");
  }
  if (stage.approval_status || stage.approval_comment) {
    consequences.push("The saved E-Verification decision and remarks will be cleared.");
  }
  if (stage.key === "closed" && (caseData.closure_reason || caseData.closure_comment)) {
    consequences.push("The closure reason and closure remarks will be cleared.");
  }

  return consequences;
}

function QueryDetailBlock({ title, value }) {
  return (
    <div>
      <strong>{title}</strong>
      <p className="query-detail-text">{value || "Not recorded."}</p>
    </div>
  );
}

function buildEmptyQueryEditForm() {
  return {
    details: "",
    resolution_details: "",
  };
}

function buildQueryEditForm(query) {
  return {
    details: query?.details || "",
    resolution_details: query?.resolution_details || "",
  };
}

function buildEmptyOpsAnswers() {
  return OPS_REVIEW_QUESTIONS.reduce((acc, question) => {
    acc[question.key] = { answer: "", comment: "" };
    return acc;
  }, {});
}

function buildOpsAnswersFromStage(stage) {
  const savedQuestions = stage.ops_review_form?.questions || {};

  return OPS_REVIEW_QUESTIONS.reduce((acc, question) => {
    acc[question.key] = {
      answer: savedQuestions[question.key]?.answer || "",
      comment: savedQuestions[question.key]?.comment || "",
    };
    return acc;
  }, {});
}
