import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { Employee } from '../api/types';
import { Role } from '../auth/roles';
import { useAuth } from '../auth/useAuth';
import { DeleteEmployeeDialog } from '../components/DeleteEmployeeDialog';
import { SelectField } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, ErrorAlert, LoadingState, Notice } from '../components/StatusViews';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useEmployees } from '../hooks/useEmployees';
import { compareText, formatSalary } from '../lib/format';

interface Filters {
  query: string;
  department: string;
  role: string;
}

const NO_FILTERS: Filters = { query: '', department: '', role: '' };

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort(compareText);
}

function matches(employee: Employee, filters: Filters): boolean {
  const query = filters.query.trim().toLowerCase();
  if (filters.department && employee.department !== filters.department) return false;
  if (filters.role && employee.role !== filters.role) return false;
  if (!query) return true;
  return [employee.name, employee.email, employee.department, employee.role].some((value) =>
    value.toLowerCase().includes(query),
  );
}

function Restricted() {
  return (
    <span className="muted" title="Only managers and the employee can see this">
      Restricted
    </span>
  );
}

export function EmployeesPage() {
  useDocumentTitle('Employees');
  const { hasRole, isSelf } = useAuth();
  const isManager = hasRole(Role.MANAGER);
  const employees = useEmployees();
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<string | null>(() => {
    const state = location.state as { notice?: string } | null;
    return state?.notice ?? null;
  });

  const all = useMemo(() => employees.data ?? [], [employees.data]);
  const departments = useMemo(() => uniqueSorted(all.map((e) => e.department)), [all]);
  const roles = useMemo(() => uniqueSorted(all.map((e) => e.role)), [all]);
  const visible = useMemo(
    () => all.filter((employee) => matches(employee, filters)).sort((a, b) => compareText(a.name, b.name)),
    [all, filters],
  );
  const filtering = filters.query !== '' || filters.department !== '' || filters.role !== '';

  const dismissNotice = () => {
    setNotice(null);
    void navigate(location.pathname, { replace: true, state: null });
  };

  const handleDeleted = (name: string) => {
    setPendingDelete(null);
    employees.setData((current) => current.filter((employee) => employee.name !== name));
    setNotice(`${name} was deleted.`);
  };

  return (
    <>
      <PageHeader
        title="Employees"
        description={
          isManager
            ? 'Everyone in the company. As a manager you can see and edit every field.'
            : 'Everyone in the company. Salary and address are only shown on your own record.'
        }
        actions={
          isManager && (
            <Link to="/employees/new" className="button button--primary">
              New employee
            </Link>
          )
        }
      />

      {notice && <Notice onDismiss={dismissNotice}>{notice}</Notice>}

      <section className="panel" aria-label="Employee directory">
        <form className="filters" role="search" onSubmit={(event) => event.preventDefault()}>
          <div className="field filters__search">
            <label className="field__label" htmlFor="employee-search">
              Search
            </label>
            <input
              id="employee-search"
              className="field__control"
              type="search"
              placeholder="Name, email, department or role"
              value={filters.query}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
            />
          </div>
          <SelectField
            label="Department"
            value={filters.department}
            onChange={(department) => setFilters((current) => ({ ...current, department }))}
            options={departments.map((value) => ({ value, label: value }))}
            placeholder="All departments"
          />
          <SelectField
            label="Role"
            value={filters.role}
            onChange={(role) => setFilters((current) => ({ ...current, role }))}
            options={roles.map((value) => ({ value, label: value }))}
            placeholder="All roles"
          />
          {filtering && (
            <button type="button" className="button button--ghost filters__clear" onClick={() => setFilters(NO_FILTERS)}>
              Clear filters
            </button>
          )}
        </form>

        {employees.status === 'loading' && <LoadingState label="Loading employees…" />}
        {employees.status === 'error' && <ErrorAlert error={employees.error} onRetry={employees.reload} />}
        {employees.status === 'success' && all.length === 0 && (
          <EmptyState title="No employees yet">
            {isManager ? <Link to="/employees/new">Create the first employee</Link> : 'Ask a manager to add people.'}
          </EmptyState>
        )}
        {employees.status === 'success' && all.length > 0 && visible.length === 0 && (
          <EmptyState title="No employees match these filters">
            <button type="button" className="button button--small" onClick={() => setFilters(NO_FILTERS)}>
              Clear filters
            </button>
          </EmptyState>
        )}

        {visible.length > 0 && (
          <>
            <p className="result-count" aria-live="polite">
              Showing {visible.length} of {all.length} {all.length === 1 ? 'employee' : 'employees'}
            </p>
            <div className="table-wrap" role="region" aria-label="Employees table" tabIndex={0}>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Department</th>
                    <th scope="col">Role</th>
                    <th scope="col">Email</th>
                    <th scope="col" className="table__num">
                      Salary
                    </th>
                    <th scope="col">Address</th>
                    {isManager && (
                      <th scope="col">
                        <span className="visually-hidden">Actions</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((employee) => (
                    <tr key={employee.name} className={isSelf(employee.name) ? 'table__row--self' : undefined}>
                      <th scope="row">
                        <Link to={`/employees/${encodeURIComponent(employee.name)}`}>{employee.name}</Link>
                        {isSelf(employee.name) && <span className="tag">You</span>}
                      </th>
                      <td>{employee.department}</td>
                      <td>{employee.role}</td>
                      <td>
                        <a href={`mailto:${employee.email}`}>{employee.email}</a>
                      </td>
                      <td className="table__num">
                        {employee.salary !== null ? formatSalary(employee.salary) : <Restricted />}
                      </td>
                      <td>{employee.address ?? <Restricted />}</td>
                      {isManager && (
                        <td className="table__actions">
                          <Link
                            to={`/employees/${encodeURIComponent(employee.name)}/edit`}
                            className="button button--small"
                            aria-label={`Edit ${employee.name}`}
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="button button--small button--danger-ghost"
                            onClick={() => setPendingDelete(employee.name)}
                            aria-label={`Delete ${employee.name}`}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {isManager && (
        <DeleteEmployeeDialog name={pendingDelete} onCancel={() => setPendingDelete(null)} onDeleted={handleDeleted} />
      )}
    </>
  );
}
