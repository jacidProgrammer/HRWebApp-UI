import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import type { Employee, Feedback } from '../api/types';
import { AuthContext } from '../auth/AuthContext';
import { createAuthValue } from '../auth/createAuthValue';
import type { Role } from '../auth/roles';
import type { AuthUser } from '../auth/user';

export function makeUser(username: string, roles: Role[]): AuthUser {
  return { username, displayName: username, email: null, roles };
}

export const managerUser = makeUser('manager', ['MANAGER']);
/** Keycloak lower-cases usernames, so the employee "Jose" signs in as "jose". */
export const employeeUser = makeUser('jose', ['EMPLOYEE']);

interface RenderOptions {
  user: AuthUser;
  /** Initial URL. */
  route?: string;
  /** Route pattern the element is mounted at, e.g. "/employees/:name". Defaults to "*". */
  path?: string;
}

export function renderWithAuth(ui: ReactElement, { user, route = '/', path = '*' }: RenderOptions): RenderResult & {
  logout: ReturnType<typeof vi.fn>;
} {
  const logout = vi.fn();
  const result = render(
    <AuthContext.Provider value={createAuthValue(user, logout)}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
          <Route path="*" element={<p>Other page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return { ...result, logout };
}

export const jose: Employee = {
  name: 'Jose',
  department: 'IT',
  role: 'Java Senior Backend',
  email: 'jose@example.com',
  salary: 75600,
  address: 'Mainz, Germany',
};

export const louisa: Employee = {
  name: 'Louisa',
  department: 'IT',
  role: 'Senior Agile Coach',
  email: 'louisa@example.com',
  salary: 79600,
  address: 'Mainz, Germany',
};

export const maria: Employee = {
  name: 'Maria',
  department: 'Sales',
  role: 'Account Executive',
  email: 'maria@example.com',
  salary: 61000,
  address: 'Berlin, Germany',
};

export const hidden = (employee: Employee): Employee => ({ ...employee, salary: null, address: null });

export const feedbackAboutLouisa: Feedback = {
  name: 'Louisa',
  message: 'Louisa is doing a great job as an Agile Coach!',
  score: 0.97,
  label: 'positive',
};

export const unanalysedFeedbackAboutJose: Feedback = {
  name: 'Jose',
  message: 'Jose is an excellent Java Backend Developer!',
  score: null,
  label: null,
};
