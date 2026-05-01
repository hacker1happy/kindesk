export default function FeedbackDialog({
  title,
  message,
  detail,
  tone = "success",
  actionLabel = "OK",
  onClose,
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className={`confirm-modal feedback-modal feedback-${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="feedback-icon" aria-hidden="true">
          {tone === "error" ? "!" : tone === "warning" ? "i" : "OK"}
        </div>
        <h3 id="feedback-modal-title">{title}</h3>
        <p>{message}</p>
        {detail && <p className="confirm-modal-detail">{detail}</p>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
