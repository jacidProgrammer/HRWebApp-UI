import { useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { employeesApi } from '../api/employees';
import type { EmployeeInput } from '../api/types';
import { EmployeeForm } from '../components/EmployeeForm';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, ErrorAlert, LoadingState } from '../components/StatusViews';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function EmployeeEditPage() {
  const { name = '' } = useParams();
  useDocumentTitle(`Edit ${name}`);
  const navigate = useNavigate();
  const load = useCallback(() => employeesApi.get(name), [name]);
  const employee = useAsync(load);
  const detailPath = `/employees/${encodeURIComponent(name)}`;

  const save = async (input: EmployeeInput) => {
    const updated = await employeesApi.update(name, input);
    await navigate(`/employees/${encodeURIComponent(updated.name)}`, {
      state: { notice: `Changes to ${updated.name} were saved.` },
    });
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to="/employees">Employees</Link>
        <span aria-hidden="true">/</span>
        <Link to={detailPath}>{name}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Edit</span>
      </nav>
      <PageHeader title={`Edit ${name}`} description="A manager replaces every field; all of them are required." />
      {employee.status === 'loading' && <LoadingState label="Loading employee…" />}
      {employee.status === 'error' &&
        (employee.error.kind === 'NOT_FOUND' ? (
          <EmptyState title={`There is no employee called “${name}”`}>
            <Link to="/employees">Back to employees</Link>
          </EmptyState>
        ) : (
          <ErrorAlert error={employee.error} onRetry={employee.reload} />
        ))}
      {employee.status === 'success' && (
        <section className="panel">
          <EmployeeForm mode="edit" initial={employee.data} onSubmit={save} cancelTo={detailPath} />
        </section>
      )}
    </>
  );
}
