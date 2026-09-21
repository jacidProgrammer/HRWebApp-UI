import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { restoreApi, useMockApi } from '../../test/mockApi';
import { employeeUser, managerUser, renderWithProviders } from '../../test/render';
import { PeoplePage } from './PeoplePage';

afterEach(restoreApi);

const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);
const location = () => screen.getByTestId('location').textContent;

describe('PeoplePage', () => {
  it('shows compensation to managers only', async () => {
    useMockApi('manager');
    renderWithProviders(<PeoplePage />, { user: managerUser, route: '/people' });
    await screen.findByRole('table');
    expect(screen.getByRole('columnheader', { name: /Salary/ })).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(12);
  });

  it('is a read-only directory for employees', async () => {
    useMockApi('jose');
    renderWithProviders(<PeoplePage />, { user: employeeUser, route: '/directory' });
    await screen.findByRole('table');
    expect(screen.queryByRole('columnheader', { name: /Salary/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Add person/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Actions for/ })).not.toBeInTheDocument();
  });

  it('keeps sorting and filters in the URL', async () => {
    useMockApi('manager');
    const user = userEvent.setup();
    renderWithProviders(<PeoplePage />, { user: managerUser, route: '/people?sort=salary&dir=desc' });
    await screen.findByRole('table');

    const salary = screen.getByRole('columnheader', { name: /Salary/ });
    expect(salary).toHaveAttribute('aria-sort', 'descending');

    await user.click(within(screen.getByRole('columnheader', { name: /^Name/ })).getByRole('button'));
    expect(location()).toBe('/people');
    expect(screen.getByRole('columnheader', { name: /^Name/ })).toHaveAttribute('aria-sort', 'ascending');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Department' }), 'Sales');
    expect(location()).toBe('/people?dept=Sales');
    expect(bodyRows().length).toBeGreaterThan(0);
    for (const row of bodyRows()) expect(row).toHaveTextContent('Sales');
  });

  it('opens the person when a row is clicked', async () => {
    useMockApi('manager');
    const user = userEvent.setup();
    renderWithProviders(<PeoplePage />, { user: managerUser, route: '/people' });
    await screen.findByRole('table');

    const [first] = bodyRows();
    await user.click(within(first as HTMLElement).getAllByRole('cell')[1] as HTMLElement);

    expect(location()).toMatch(/^\/people\/[0-9a-f-]{36}$/);
  });

  it('deletes a person after confirmation', async () => {
    const api = useMockApi('manager');
    const user = userEvent.setup();
    renderWithProviders(<PeoplePage />, { user: managerUser, route: '/people' });
    await screen.findByRole('table');
    const target = api.db.data.employees.find((e) => e.username === 'lukas');

    await user.click(screen.getByRole('button', { name: `Actions for ${target?.name}` }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    const dialog = screen.getByRole('alertdialog', { name: `Delete ${target?.name}?` });
    await user.click(within(dialog).getByRole('button', { name: 'Delete person' }));

    await waitFor(() => expect(bodyRows()).toHaveLength(11));
    expect(screen.queryByText(target?.name ?? '')).not.toBeInTheDocument();
    expect(api.db.data.employees.some((e) => e.id === target?.id)).toBe(false);
  });
});
