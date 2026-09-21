import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { employeesApi } from '../api/employees';
import { ApiError } from '../api/errors';
import { employeeUser, hidden, jose, louisa, managerUser, maria, renderWithAuth } from '../test/render';
import { EmployeesPage } from './EmployeesPage';

vi.mock('../api/employees', () => ({
  employeesApi: { list: vi.fn(), remove: vi.fn() },
}));

const list = vi.mocked(employeesApi.list);
const remove = vi.mocked(employeesApi.remove);

function rowFor(name: string) {
  const cell = screen.getByRole('rowheader', { name: new RegExp(`^${name}`) });
  return cell.closest('tr') as HTMLTableRowElement;
}

describe('EmployeesPage as a manager', () => {
  beforeEach(() => {
    list.mockResolvedValue([louisa, maria, jose]);
  });

  it('lists every employee with all fields and the manager actions', async () => {
    renderWithAuth(<EmployeesPage />, { user: managerUser });

    expect(screen.getByRole('status')).toHaveTextContent('Loading employees…');
    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(within(rowFor('Louisa')).getByText('79,600')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New employee' })).toHaveAttribute('href', '/employees/new');
    expect(screen.getByRole('link', { name: 'Edit Maria' })).toHaveAttribute('href', '/employees/Maria/edit');
    expect(screen.getByRole('button', { name: 'Delete Maria' })).toBeInTheDocument();
  });

  it('filters by search text, department and role', async () => {
    const user = userEvent.setup();
    renderWithAuth(<EmployeesPage />, { user: managerUser });
    await screen.findByRole('table');

    await user.selectOptions(screen.getByLabelText('Department'), 'Sales');
    expect(screen.getByText('Showing 1 of 3 employees')).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Maria' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await user.selectOptions(screen.getByLabelText('Role'), 'Senior Agile Coach');
    expect(screen.getAllByRole('rowheader').map((cell) => cell.textContent)).toEqual(['Louisa']);

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await user.type(screen.getByLabelText('Search'), 'nobody');
    expect(screen.getByText('No employees match these filters')).toBeInTheDocument();
  });

  it('deletes an employee only after confirmation', async () => {
    const user = userEvent.setup();
    remove.mockResolvedValue();
    renderWithAuth(<EmployeesPage />, { user: managerUser });
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: 'Delete Maria' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Delete Maria?' });
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    expect(remove).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Delete employee' }));

    expect(remove).toHaveBeenCalledWith('Maria');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(screen.queryByRole('rowheader', { name: 'Maria' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Maria was deleted.');
  });

  it('keeps the dialog open and shows the error when the delete fails', async () => {
    const user = userEvent.setup();
    remove.mockRejectedValue(new ApiError('NOT_FOUND', "Employee 'Maria' not found", 404, 'NOT_FOUND'));
    renderWithAuth(<EmployeesPage />, { user: managerUser });
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: 'Delete Maria' }));
    await user.click(screen.getByRole('button', { name: 'Delete employee' }));

    const dialog = screen.getByRole('alertdialog');
    expect(await within(dialog).findByRole('alert')).toHaveTextContent("Employee 'Maria' not found");
  });

  it('shows the error with a retry button when the list cannot be loaded', async () => {
    const user = userEvent.setup();
    list.mockReset();
    list.mockRejectedValueOnce(new ApiError('NETWORK', 'Cannot reach the HR service.')).mockResolvedValueOnce([jose]);
    renderWithAuth(<EmployeesPage />, { user: managerUser });

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the HR service.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('rowheader', { name: 'Jose' })).toBeInTheDocument();
  });
});

describe('EmployeesPage as an employee', () => {
  beforeEach(() => {
    // What the API returns to "jose": his own record complete, the others without salary/address
    list.mockResolvedValue([jose, hidden(louisa)]);
  });

  it('hides manager controls and marks the fields the API did not return as restricted', async () => {
    renderWithAuth(<EmployeesPage />, { user: employeeUser });
    await screen.findByRole('table');

    expect(screen.queryByRole('link', { name: 'New employee' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /edit/i })).not.toBeInTheDocument();

    const own = rowFor('Jose');
    expect(within(own).getByText('You')).toBeInTheDocument();
    expect(within(own).getByText('75,600')).toBeInTheDocument();
    expect(within(own).getByText('Mainz, Germany')).toBeInTheDocument();

    expect(within(rowFor('Louisa')).getAllByText('Restricted')).toHaveLength(2);
  });

  it('shows an empty state when there are no employees', async () => {
    list.mockResolvedValue([]);
    renderWithAuth(<EmployeesPage />, { user: employeeUser });

    expect(await screen.findByText('No employees yet')).toBeInTheDocument();
    expect(screen.getByText('Ask a manager to add people.')).toBeInTheDocument();
  });
});
