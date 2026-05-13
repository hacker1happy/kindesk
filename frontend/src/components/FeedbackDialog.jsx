import { useEffect, useRef } from "react";

export default function FeedbackDialog({
  title,
  message,
  detail,
  tone = "success",
  actionLabel = "OK",
  onClose,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const focusable = dialogRef.current?.querySelector("button:not(:disabled)");

    window.requestAnimationFrame(() => focusable?.focus());

    return () => {
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.blur();
    };
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault();
      onClose?.();
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className={`confirm-modal feedback-modal feedback-${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
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
