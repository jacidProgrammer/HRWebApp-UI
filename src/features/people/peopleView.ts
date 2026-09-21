import type { Employee } from '../../api/types';
import { compareText } from '../../lib/format';

export const SORT_KEYS = ['name', 'department', 'role', 'email', 'salary', 'createdAt'] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDirection = 'asc' | 'desc';

export interface PeopleView {
  q: string;
  department: string;
  sort: SortKey;
  dir: SortDirection;
}

const isSortKey = (value: string | null): value is SortKey => !!value && (SORT_KEYS as readonly string[]).includes(value);

/** Reads the directory state from the URL (`?q=&dept=&sort=&dir=`), ignoring invalid values. */
export function readPeopleView(params: URLSearchParams): PeopleView {
  const sort = params.get('sort');
  return {
    q: params.get('q') ?? '',
    department: params.get('dept') ?? '',
    sort: isSortKey(sort) ? sort : 'name',
    dir: params.get('dir') === 'desc' ? 'desc' : 'asc',
  };
}

/** Writes only non-default values, so a plain directory has a clean URL. */
export function writePeopleView(view: PeopleView): URLSearchParams {
  const params = new URLSearchParams();
  if (view.q.trim()) params.set('q', view.q);
  if (view.department) params.set('dept', view.department);
  if (view.sort !== 'name') params.set('sort', view.sort);
  if (view.dir !== 'asc') params.set('dir', view.dir);
  return params;
}

/** The next sort state when a column header is clicked: same column flips, a new column starts ascending. */
export function toggleSort(view: PeopleView, key: SortKey): PeopleView {
  if (view.sort === key) return { ...view, dir: view.dir === 'asc' ? 'desc' : 'asc' };
  return { ...view, sort: key, dir: 'asc' };
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export function applyPeopleView(employees: Employee[], view: PeopleView): Employee[] {
  const terms = normalize(view.q).split(/\s+/).filter(Boolean);
  const filtered = employees.filter((employee) => {
    if (view.department && employee.department !== view.department) return false;
    if (!terms.length) return true;
    const haystack = normalize(`${employee.name} ${employee.username} ${employee.email} ${employee.role} ${employee.department}`);
    return terms.every((term) => haystack.includes(term));
  });
  const direction = view.dir === 'asc' ? 1 : -1;
  return [...filtered].sort((a, b) => {
    let result: number;
    if (view.sort === 'salary') {
      // People without a visible salary always go last.
      if (a.salary === null || b.salary === null) return a.salary === b.salary ? 0 : a.salary === null ? 1 : -1;
      result = a.salary - b.salary;
    } else if (view.sort === 'createdAt') {
      result = a.createdAt.localeCompare(b.createdAt);
    } else {
      result = compareText(a[view.sort], b[view.sort]);
    }
    return (result || compareText(a.name, b.name)) * direction;
  });
}

export function departmentsOf(employees: Employee[]): string[] {
  return [...new Set(employees.map((e) => e.department))].sort(compareText);
}
