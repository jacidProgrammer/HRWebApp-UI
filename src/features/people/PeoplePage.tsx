import { ArrowDown, ArrowUp, ChevronsUpDown, MoreHorizontal, Pencil, Search, Trash2, UserPlus, UsersRound } from 'lucide-react';
import { useMemo, useState, type MouseEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEmployees } from '../../api/hooks';
import type { Employee } from '../../api/types';
import { useAuth } from '../../auth/useAuth';
import { usePageTitle } from '../../components/shell/pageTitle';
import { ErrorState } from '../../components/ui/Alert';
import { Avatar } from '../../components/ui/Avatar';
import { DepartmentChip } from '../../components/ui/Chips';
import { EmptyState } from '../../components/ui/EmptyState';
import { MenuButton } from '../../components/ui/Menu';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { useI18n } from '../../i18n/context';
import type { MessageKey } from '../../i18n/core';
import { useFormat } from '../../lib/format';
import { DeletePersonDialog } from './DeletePersonDialog';
import { applyPeopleView, departmentsOf, readPeopleView, toggleSort, writePeopleView, type PeopleView, type SortKey } from './peopleView';
import './PeoplePage.css';

interface Column {
  key: SortKey;
  label: MessageKey;
  className?: string;
  numeric?: boolean;
}

function SortHeader({ column, view, onSort }: { column: Column; view: PeopleView; onSort: (key: SortKey) => void }) {
  const { t } = useI18n();
  const active = view.sort === column.key;
  const Icon = !active ? ChevronsUpDown : view.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      className={`${column.className ?? ''}${column.numeric ? ' num' : ''}`}
      aria-sort={active ? (view.dir === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <button type="button" className={`sort-button${active ? ' sort-button--active' : ''}`} onClick={() => onSort(column.key)}>
        {t(column.label)}
        <Icon size={14} aria-hidden="true" />
      </button>
    </th>
  );
}

/**
 * Directory for everyone; managers additionally see salary and location, can add people and edit or delete
 * them from each row's menu. Search, department filter and sort live in the URL.
 */
export function PeoplePage() {
  const { t, tp } = useI18n();
  const format = useFormat();
  const navigate = useNavigate();
  const { hasRole, isSelf } = useAuth();
  const isManager = hasRole('MANAGER');
  usePageTitle(isManager ? t('people.title') : t('directory.title'));

  const [params, setParams] = useSearchParams();
  const view = readPeopleView(params);
  const setView = (next: PeopleView) => setParams(writePeopleView(next), { replace: true });
  const [toDelete, setToDelete] = useState<Employee | null>(null);

  const employees = useEmployees();
  const departments = useMemo(() => departmentsOf(employees.data ?? []), [employees.data]);
  const rows = useMemo(() => applyPeopleView(employees.data ?? [], view), [employees.data, view]);

  const columns: Column[] = [
    { key: 'department', label: 'field.department', className: 'col-department' },
    { key: 'role', label: 'field.role', className: 'col-role' },
    { key: 'email', label: 'field.email', className: 'col-email' },
    ...(isManager ? [{ key: 'salary' as const, label: 'field.salary' as const, className: 'col-salary', numeric: true }] : []),
  ];

  const open = (employee: Employee) => void navigate(`/people/${employee.id}`);
  const onRowClick = (event: MouseEvent, employee: Employee) => {
    // Let links, buttons and text selection behave normally.
    if ((event.target as HTMLElement).closest('a, button') || window.getSelection()?.toString()) return;
    open(employee);
  };

  return (
    <div className="page">
      <div className="page-intro">
        <p className="page-intro__text">{isManager ? t('people.intro') : t('directory.intro')}</p>
        {isManager && (
          <div className="page-intro__actions">
            <Link to="/people/new" className="btn btn--primary">
              <UserPlus size={16} aria-hidden="true" />
              {t('people.add')}
            </Link>
          </div>
        )}
      </div>

      <section className="card people-card" aria-labelledby="people-count">
        <div className="toolbar" role="search">
          <div className="toolbar__search input-wrap input-wrap--leading">
            <span className="input-wrap__leading">
              <Search size={16} aria-hidden="true" />
            </span>
            <input
              type="search"
              className="input"
              placeholder={t('people.search')}
              aria-label={t('people.search')}
              value={view.q}
              onChange={(event) => setView({ ...view, q: event.target.value })}
            />
          </div>
          <select
            className="input toolbar__select"
            aria-label={t('field.department')}
            value={view.department}
            onChange={(event) => setView({ ...view, department: event.target.value })}
          >
            <option value="">{t('people.allDepartments')}</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
          <p id="people-count" className="toolbar__count" aria-live="polite">
            {employees.data ? tp('people.count', rows.length) : ''}
          </p>
        </div>

        {employees.isPending ? (
          <SkeletonTable rows={8} columns={isManager ? 5 : 4} />
        ) : employees.isError ? (
          <div className="card__body">
            <ErrorState error={employees.error} onRetry={() => void employees.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            tone="neutral"
            title={employees.data.length ? t('people.noMatches.title') : t('people.empty.title')}
            action={
              employees.data.length ? (
                <button type="button" className="btn btn--secondary" onClick={() => setParams({}, { replace: true })}>
                  {t('common.clearFilters')}
                </button>
              ) : undefined
            }
          >
            {employees.data.length ? t('people.noMatches.body') : t('people.empty.body')}
          </EmptyState>
        ) : (
          <div className="table-scroll">
            <table className="table people-table">
              <caption className="visually-hidden">{isManager ? t('people.title') : t('directory.title')}</caption>
              <thead>
                <tr>
                  <SortHeader column={{ key: 'name', label: 'people.column.name', className: 'col-person' }} view={view} onSort={(key) => setView(toggleSort(view, key))} />
                  {columns.map((column) => (
                    <SortHeader key={column.key} column={column} view={view} onSort={(key) => setView(toggleSort(view, key))} />
                  ))}
                  {isManager && <th scope="col" className="col-location">{t('field.location')}</th>}
                  {isManager && (
                    <th scope="col" className="col-actions">
                      <span className="visually-hidden">{t('common.actions')}</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((employee) => (
                  <tr key={employee.id} className="table__row--link" onClick={(event) => onRowClick(event, employee)}>
                    <th scope="row" className="col-person">
                      <div className="person-cell">
                        <Avatar name={employee.name} size="sm" />
                        <div className="person-cell__text">
                          <Link to={`/people/${employee.id}`} className="person-cell__name">
                            {employee.name}
                          </Link>
                          {isSelf(employee.username) && <span className="badge badge--accent">{t('people.you')}</span>}
                          <span className="person-cell__meta">{employee.role}</span>
                        </div>
                      </div>
                    </th>
                    <td className="col-department">
                      <DepartmentChip department={employee.department} />
                    </td>
                    <td className="col-role">{employee.role}</td>
                    <td className="col-email">
                      <a href={`mailto:${employee.email}`} className="subtle-link">
                        {employee.email}
                      </a>
                    </td>
                    {isManager && <td className="col-salary num tabular">{employee.salary !== null ? format.currency(employee.salary) : '–'}</td>}
                    {isManager && <td className="col-location">{employee.address ?? '–'}</td>}
                    {isManager && (
                      <td className="col-actions">
                        <MenuButton
                          label={t('people.actionsFor', { name: employee.name })}
                          triggerClassName="btn btn--ghost btn--icon btn--sm"
                          entries={[
                            { id: 'edit', label: t('common.edit'), icon: Pencil, onSelect: () => void navigate(`/people/${employee.id}/edit`) },
                            { type: 'separator', id: 'sep' },
                            { id: 'delete', label: t('common.delete'), icon: Trash2, danger: true, onSelect: () => setToDelete(employee) },
                          ]}
                        >
                          <MoreHorizontal size={18} aria-hidden="true" />
                        </MenuButton>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DeletePersonDialog employee={toDelete} onClose={() => setToDelete(null)} />
    </div>
  );
}
