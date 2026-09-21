import type { Employee } from '../../api/types';

export type PersonOption = Pick<Employee, 'id' | 'name' | 'username' | 'department' | 'role'>;

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export function filterPeople<T extends PersonOption>(people: T[], query: string): T[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return people;
  return people.filter((person) => {
    const haystack = normalize(`${person.name} ${person.username} ${person.department} ${person.role}`);
    return terms.every((term) => haystack.includes(term));
  });
}
