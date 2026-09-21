import { ArrowLeft, UserX } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEmployee, useEmployees, useUpdateEmployee } from '../../api/hooks';
import { usePageTitle } from '../../components/shell/pageTitle';
import { ErrorState } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingRegion, Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/toastContext';
import { useI18n } from '../../i18n/context';
import { EmployeeForm } from './EmployeeForm';
import { departmentsOf } from './peopleView';

export default function PersonEditPage() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const employee = useEmployee(id);
  const employees = useEmployees();
  const update = useUpdateEmployee(id);
  usePageTitle(employee.data ? t('people.editTitle', { name: employee.data.name }) : t('common.edit'));

  return (
    <div className="page">
      <Link to={`/people/${id}`} className="back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        {employee.data ? t('person.backTo', { name: employee.data.name }) : t('person.backPeople')}
      </Link>
      {employee.isPending ? (
        <LoadingRegion>
          <Skeleton height={480} radius={12} />
        </LoadingRegion>
      ) : employee.isError ? (
        employee.error.kind === 'NOT_FOUND' ? (
          <EmptyState icon={UserX} tone="neutral" title={t('person.notFound.title')}>
            {t('person.notFound.body')}
          </EmptyState>
        ) : (
          <ErrorState error={employee.error} onRetry={() => void employee.refetch()} />
        )
      ) : (
        <EmployeeForm
          key={employee.data.id}
          employee={employee.data}
          departments={departmentsOf(employees.data ?? [])}
          submitLabel={t('common.saveChanges')}
          busy={update.isPending}
          error={update.error}
          cancelTo={`/people/${id}`}
          onSubmit={({ username: _username, ...input }) =>
            update.mutate(input, {
              onSuccess: (saved) => {
                toast.show({ title: t('people.saved', { name: saved.name }) });
                void navigate(`/people/${saved.id}`);
              },
            })
          }
        />
      )}
    </div>
  );
}
