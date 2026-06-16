import { Modal } from "./Modal";
import { Button } from "./Button";

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

export function ConfirmDialog({
  isOpen, onClose, onConfirm,
  title = "Confirmar accion",
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      {description ? <p className="mb-5 text-sm text-brand-muted">{description}</p> : null}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>{cancelLabel}</Button>
        <Button variant={danger ? "danger" : "primary"} size="sm" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
