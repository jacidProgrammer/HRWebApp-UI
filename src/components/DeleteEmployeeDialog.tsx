import { useState } from 'react';
import { employeesApi } from '../api/employees';
import { toApiError, type ApiError } from '../api/errors';
import { ConfirmDialog } from './ConfirmDialog';

interface DeleteEmployeeDialogProps {
  /** The employee to delete, or null when the dialog is closed. */
  name: string | null;
  onCancel: () => void;
  onDeleted: (name: string) => void;
}

export function DeleteEmployeeDialog({ name, onCancel, onDeleted }: DeleteEmployeeDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const close = () => {
    setError(null);
    onCancel();
  };

  const confirm = async () => {
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      await employeesApi.remove(name);
      onDeleted(name);
    } catch (caught) {
      setError(toApiError(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmDialog
      open={name !== null}
      title={`Delete ${name ?? 'employee'}?`}
      confirmLabel="Delete employee"
      busyLabel="Deleting…"
      busy={busy}
      onCancel={close}
      onConfirm={() => void confirm()}
    >
      <p>
        This permanently removes <strong>{name}</strong> from the directory. This cannot be undone.
      </p>
      {error && (
        <p className="dialog__error" role="alert">
          {error.message}
        </p>
      )}
    </ConfirmDialog>
  );
}
