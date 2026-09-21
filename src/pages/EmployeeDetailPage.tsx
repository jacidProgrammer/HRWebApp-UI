import { useCallback, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { employeesApi } from '../api/employees';
import { ApiError } from '../api/errors';
import { feedbackApi } from '../api/feedback';
import type { Employee } from '../api/types';
import { Role } from '../auth/roles';
import { useAuth } from '../auth/useAuth';
import { DeleteEmployeeDialog } from '../components/DeleteEmployeeDialog';
import { FeedbackList } from '../components/FeedbackList';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, ErrorAlert, LoadingState, Notice } from '../components/StatusViews';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatSalary } from '../lib/format';

/**
 * GET /employees/{name} is manager-only, so employees look the person up in the list they are allowed
 * to see (which already hides other people's salary and address).
 */
function loadEmployee(name: string, asManager: boolean): Promise<Employee> {
  if (asManager) return employeesApi.get(name);
  return employeesApi.list().then((employees) => {
    const found = employees.find((employee) => employee.name.toLowerCase() === name.toLowerCase());
    if (!found) throw new ApiError('NOT_FOUND', `Employee '${name}' not found`, 404, 'NOT_FOUND');
    return found;
  });
}

function FeedbackAbout({ name, isSelf }: { name: string; isSelf: boolean }) {
  const load = useCallback(() => feedbackApi.listAbout(name), [name]);
  const feedback = useAsync(load);
  return (
    <section className="panel" aria-labelledby="feedback-about-title">
      <div className="panel__header">
        <h2 id="feedback-about-title" className="panel__title">
          {isSelf ? 'Feedback about you' : `Feedback about ${name}`}
        </h2>
        {!isSelf && (
          <Link to={`/feedback?about=${encodeURIComponent(name)}`} className="button button--small">
            Send feedback
          </Link>
        )}
      </div>
      {feedback.status === 'loading' && <LoadingState label="Loading feedback…" />}
      {feedback.status === 'error' && <ErrorAlert error={feedback.error} onRetry={feedback.reload} />}
      {feedback.status === 'success' &&
        (feedback.data.length === 0 ? (
          <EmptyState title="No feedback yet" />
        ) : (
          <FeedbackList items={feedback.data} showSubject={false} />
        ))}
    </section>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="details__item">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function EmployeeDetailPage() {
  const { name = '' } = useParams();
  const { hasRole, isSelf } = useAuth();
  const isManager = hasRole(Role.MANAGER);
  const isEmployee = hasRole(Role.EMPLOYEE);
  useDocumentTitle(name);
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<string | null>(() => (location.state as { notice?: string } | null)?.notice ?? null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const load = useCallback(() => loadEmployee(name, isManager), [name, isManager]);
  const employee = useAsync(load);

  if (employee.status === 'loading') return <LoadingState label="Loading employee…" />;

  if (employee.status === 'error') {
    return (
      <>
        <PageHeader title={name} />
        {employee.error.kind === 'NOT_FOUND' ? (
          <EmptyState title={`There is no employee called “${name}”`}>
            <Link to="/employees">Back to employees</Link>
          </EmptyState>
        ) : (
          <ErrorAlert error={employee.error} onRetry={employee.reload} />
        )}
      </>
    );
  }

  const person = employee.data;
  const self = isSelf(person.name);

  return (
    <>
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to="/employees">Employees</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{person.name}</span>
      </nav>
      <PageHeader
        title={person.name}
        description={`${person.role} · ${person.department}`}
        actions={
          <>
            {isManager && (
              <>
                <Link to={`/employees/${encodeURIComponent(person.name)}/edit`} className="button button--primary">
                  Edit
                </Link>
                <button type="button" className="button button--danger-ghost" onClick={() => setConfirmingDelete(true)}>
                  Delete
                </button>
              </>
            )}
            {!isManager && self && (
              <Link to="/profile" className="button button--primary">
                Edit my contact details
              </Link>
            )}
          </>
        }
      />

      {notice && <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>}

      <section className="panel" aria-label="Employee details">
        <dl className="details">
          <Detail label="Name">{person.name}</Detail>
          <Detail label="Department">{person.department}</Detail>
          <Detail label="Role">{person.role}</Detail>
          <Detail label="Email">
            <a href={`mailto:${person.email}`}>{person.email}</a>
          </Detail>
          {person.salary !== null && <Detail label="Salary">{formatSalary(person.salary)}</Detail>}
          {person.address !== null && <Detail label="Address">{person.address}</Detail>}
        </dl>
        {person.salary === null && person.address === null && (
          <p className="muted">Salary and address are only visible to managers and to {person.name}.</p>
        )}
      </section>

      {isEmployee && <FeedbackAbout name={person.name} isSelf={self} />}

      {isManager && (
        <DeleteEmployeeDialog
          name={confirmingDelete ? person.name : null}
          onCancel={() => setConfirmingDelete(false)}
          onDeleted={(deleted) => void navigate('/employees', { state: { notice: `${deleted} was deleted.` } })}
        />
      )}
    </>
  );
}
