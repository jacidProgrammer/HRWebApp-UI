import { describe, expect, it } from 'vitest';
import { applyPeopleView, readPeopleView, toggleSort, writePeopleView } from './peopleView';
import { employee } from '../../test/fixtures';

const people = [
  employee({ name: 'Maria Rossi', department: 'Sales', salary: 61000 }),
  employee({ name: 'José Antonio', department: 'IT', salary: 75600 }),
  employee({ name: 'Louisa Becker', department: 'IT', salary: null, role: 'Agile Coach' }),
];

describe('people view in the URL', () => {
  it('reads defaults and ignores unknown sort keys', () => {
    expect(readPeopleView(new URLSearchParams('sort=password&dir=sideways'))).toEqual({ q: '', department: '', sort: 'name', dir: 'asc' });
  });

  it('round-trips through the URL and omits defaults', () => {
    const view = { q: 'jo', department: 'IT', sort: 'salary' as const, dir: 'desc' as const };
    expect(writePeopleView(view).toString()).toBe('q=jo&dept=IT&sort=salary&dir=desc');
    expect(readPeopleView(writePeopleView(view))).toEqual(view);
    expect(writePeopleView({ q: '', department: '', sort: 'name', dir: 'asc' }).toString()).toBe('');
  });

  it('flips the direction on the same column and starts ascending on a new one', () => {
    const view = readPeopleView(new URLSearchParams());
    expect(toggleSort(view, 'name')).toMatchObject({ sort: 'name', dir: 'desc' });
    expect(toggleSort({ ...view, dir: 'desc' }, 'salary')).toMatchObject({ sort: 'salary', dir: 'asc' });
  });
});

describe('applyPeopleView', () => {
  it('filters by department and accent-insensitive search', () => {
    const names = (view: Partial<Parameters<typeof applyPeopleView>[1]>) =>
      applyPeopleView(people, { q: '', department: '', sort: 'name', dir: 'asc', ...view }).map((e) => e.name);

    expect(names({})).toEqual(['José Antonio', 'Louisa Becker', 'Maria Rossi']);
    expect(names({ department: 'IT' })).toEqual(['José Antonio', 'Louisa Becker']);
    expect(names({ q: 'jose' })).toEqual(['José Antonio']);
    expect(names({ q: 'coach' })).toEqual(['Louisa Becker']);
  });

  it('sorts salaries numerically and keeps hidden salaries last', () => {
    const sorted = (dir: 'asc' | 'desc') =>
      applyPeopleView(people, { q: '', department: '', sort: 'salary', dir }).map((e) => e.salary);
    expect(sorted('asc')).toEqual([61000, 75600, null]);
    expect(sorted('desc')).toEqual([75600, 61000, null]);
  });
});
