import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { employeeUser, makeUser, managerUser, renderWithProviders } from '../test/render';
import { RequireRole } from './RequireRole';

describe('RequireRole', () => {
  it('renders the children for a user with the role', () => {
    renderWithProviders(
      <RequireRole anyOf={['MANAGER']}>
        <p>Dashboard</p>
      </RequireRole>,
      { user: managerUser },
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('accepts any of several roles', () => {
    renderWithProviders(
      <RequireRole anyOf={['MANAGER', 'EMPLOYEE']}>
        <p>Directory</p>
      </RequireRole>,
      { user: employeeUser },
    );
    expect(screen.getByText('Directory')).toBeInTheDocument();
  });

  it('shows an access-denied page with a way home otherwise', () => {
    renderWithProviders(
      <RequireRole anyOf={['MANAGER']}>
        <p>Dashboard</p>
      </RequireRole>,
      { user: employeeUser },
    );
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Access denied' })).toBeInTheDocument();
    expect(screen.getByText(/requires the MANAGER role/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
  });

  it('renders a custom fallback instead', () => {
    renderWithProviders(
      <RequireRole anyOf={['EMPLOYEE']} fallback={<p>Managers have no recognition inbox</p>}>
        <p>Inbox</p>
      </RequireRole>,
      { user: makeUser('boss', ['MANAGER']) },
    );
    expect(screen.getByText('Managers have no recognition inbox')).toBeInTheDocument();
  });

  it('localises the denial', () => {
    renderWithProviders(
      <RequireRole anyOf={['MANAGER']}>
        <p>Dashboard</p>
      </RequireRole>,
      { user: employeeUser, locale: 'de' },
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Zugriff verweigert' })).toBeInTheDocument();
  });
});
