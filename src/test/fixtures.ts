import type { Employee, Feedback } from '../api/types';

let counter = 0;
const id = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`;

export function employee(overrides: Partial<Employee> = {}): Employee {
  const name = overrides.name ?? 'Test Person';
  const username = overrides.username ?? name.split(' ')[0]?.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '') ?? 'test';
  return {
    id: id(),
    username,
    name,
    department: 'IT',
    role: 'Engineer',
    email: `${username}@example.com`,
    salary: 60000,
    address: 'Berlin, Germany',
    createdAt: '2025-01-15T09:00:00Z',
    ...overrides,
  };
}

export function feedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: id(),
    recipientId: 'recipient',
    recipientName: 'Louisa Becker',
    authorId: 'author',
    authorName: 'José Antonio',
    anonymous: false,
    value: 'TEAMWORK',
    message: 'Thanks for the great pairing session!',
    sentiment: { label: 'POSITIVE', score: 0.97 },
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    ...overrides,
  };
}

export const jose = employee({ name: 'José Antonio', username: 'jose', role: 'Java Senior Backend', salary: 75600, address: 'Mainz, Germany' });
export const louisa = employee({ name: 'Louisa Becker', username: 'louisa', role: 'Senior Agile Coach', salary: 79600 });
export const maria = employee({ name: 'Maria Rossi', username: 'maria', department: 'Sales', role: 'Account Executive', salary: 61000 });

/** What an employee sees of a colleague: no salary or address. */
export const hidden = (e: Employee): Employee => ({ ...e, salary: null, address: null });
