import type { Employee } from '../../api/types';
import { useDeleteEmployee } from '../../api/hooks';
import { Alert } from '../../components/ui/Alert';
import { ConfirmDialog } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/toastContext';
import { useI18n } from '../../i18n/context';
import { describeError } from '../../lib/errors';

interface Props {
  employee: Employee | null;
  onClose: () => void;
  onDeleted?: () => void;
}

/** Confirms and deletes a person. The row disappears immediately and comes back if the request fails. */
export function DeletePersonDialog({ employee, onClose, onDeleted }: Props) {
  const { t } = useI18n();
  const toast = useToast();
  const remove = useDeleteEmployee();

  const confirm = () => {
    if (!employee) return;
    remove.mutate(employee, {
      onSuccess: () => {
        toast.show({ title: t('people.delete.done', { name: employee.name }) });
        onClose();
        onDeleted?.();
      },
    });
  };

  return (
    <ConfirmDialog
      open={!!employee}
      title={t('people.delete.title', { name: employee?.name ?? '' })}
      confirmLabel={t('people.delete.confirm')}
      busy={remove.isPending}
      onConfirm={confirm}
      onCancel={() => {
        remove.reset();
        onClose();
      }}
      error={
        remove.isError ? (
          <Alert tone="danger" title={describeError(remove.error, t).title} live>
            {describeError(remove.error, t).message}
          </Alert>
        ) : undefined
      }
    >
      <p>{t('people.delete.body')}</p>
    </ConfirmDialog>
  );
}
