import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateEmployee, useEmployees } from '../../api/hooks';
import { usePageTitle } from '../../components/shell/pageTitle';
import { useToast } from '../../components/ui/toastContext';
import { useI18n } from '../../i18n/context';
import { EmployeeForm } from './EmployeeForm';
import { departmentsOf } from './peopleView';

export default function PersonCreatePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const create = useCreateEmployee();
  const employees = useEmployees();
  usePageTitle(t('people.add'));

  return (
    <div className="page">
      <Link to="/people" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        {t('person.backPeople')}
      </Link>
      <EmployeeForm
        departments={departmentsOf(employees.data ?? [])}
        submitLabel={t('people.create')}
        busy={create.isPending}
        error={create.error}
        cancelTo="/people"
        onSubmit={(input) =>
          create.mutate(input, {
            onSuccess: (created) => {
              toast.show({ title: t('people.created', { name: created.name }) });
              void navigate(`/people/${created.id}`, { replace: true });
            },
          })
        }
      />
    </div>
  );
}
