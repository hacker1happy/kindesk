import { useEffect, useRef } from "react";

export default function ConfirmationModal({
  title,
  message,
  detail,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  children,
  confirmDisabled = false,
  onCancel,
  onConfirm,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const focusable = dialogRef.current?.querySelector(
      "input, textarea, select, button:not(:disabled), [href], [tabindex]:not([tabindex='-1'])"
    );

    window.requestAnimationFrame(() => focusable?.focus());

    return () => {
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.blur();
    };
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !confirmDisabled) {
      const tagName = event.target.tagName?.toLowerCase();
      if (tagName !== "textarea") {
        event.preventDefault();
        onConfirm?.();
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onCancel?.();
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <div
        ref={dialogRef}
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h3 id="confirm-modal-title">{title}</h3>
        <p>{message}</p>
        {detail && <p className="confirm-modal-detail">{detail}</p>}
        {children}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? "btn-danger" : "btn"}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
