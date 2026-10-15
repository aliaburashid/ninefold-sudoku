import { useEffect, useRef } from "react";

export default function ConfirmDialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  onClose,
}) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => {
      element.close();
    };
  }, []);
  return (
    <dialog
      className="confirm-dialog"
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="dialog-title"
    >
      <div>
        <span className="eyebrow">A MOMENT TO CHECK</span>
        <h2 id="dialog-title">{title}</h2>
        <p>{children}</p>
        <div className="dialog-actions">
          <button className="button secondary" autoFocus onClick={onClose}>
            Keep playing
          </button>
          <button className="button primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
