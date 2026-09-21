import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { employeeUser, makeUser, managerUser, renderWithAuth } from '../test/render';
import { RequireRole } from './RequireRole';

describe('RequireRole', () => {
  it('renders the page when the user has one of the roles', () => {
    renderWithAuth(
      <RequireRole anyOf={['MANAGER', 'EMPLOYEE']}>
        <p>Secret page</p>
      </RequireRole>,
      { user: employeeUser },
    );

    expect(screen.getByText('Secret page')).toBeInTheDocument();
  });

  it('shows an access-denied page instead of manager-only content to an employee', () => {
    renderWithAuth(
      <RequireRole anyOf={['MANAGER']}>
        <p>Secret page</p>
      </RequireRole>,
      { user: employeeUser },
    );

    expect(screen.queryByText('Secret page')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Access denied' })).toBeInTheDocument();
    expect(screen.getByText(/requires the MANAGER role/)).toBeInTheDocument();
  });

  it('renders the fallback when one is given, e.g. to hide a control', () => {
    renderWithAuth(
      <RequireRole anyOf={['EMPLOYEE']} fallback={null}>
        <button type="button">Send feedback</button>
      </RequireRole>,
      { user: managerUser },
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Access denied' })).not.toBeInTheDocument();
  });

  it('denies users without any known role', () => {
    renderWithAuth(
      <RequireRole anyOf={['MANAGER', 'EMPLOYEE']}>
        <p>Secret page</p>
      </RequireRole>,
      { user: makeUser('guest', []) },
    );

    expect(screen.getByRole('heading', { name: 'Access denied' })).toBeInTheDocument();
  });
});
