import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { employeesApi } from '../api/employees';
import { ApiError } from '../api/errors';
import { jose, managerUser, renderWithAuth } from '../test/render';
import { EmployeeCreatePage } from './EmployeeCreatePage';

vi.mock('../api/employees', () => ({ employeesApi: { list: vi.fn(), create: vi.fn() } }));

const create = vi.mocked(employeesApi.create);

async function fillForm(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.type(screen.getByLabelText('Name'), name);
  await user.type(screen.getByLabelText('Email'), 'someone@example.com');
  await user.type(screen.getByLabelText('Department'), 'IT');
  await user.type(screen.getByLabelText('Role'), 'Developer');
  await user.type(screen.getByLabelText('Salary'), '50000');
  await user.type(screen.getByLabelText('Address'), 'Mainz');
}

describe('EmployeeCreatePage', () => {
  beforeEach(() => {
    vi.mocked(employeesApi.list).mockResolvedValue([jose]);
  });

  it('creates the employee and opens its page', async () => {
    const user = userEvent.setup();
    create.mockImplementation((input) => Promise.resolve(input));
    renderWithAuth(<EmployeeCreatePage />, { user: managerUser, route: '/employees/new', path: '/employees/new' });

    await fillForm(user, 'Maria');
    await user.click(screen.getByRole('button', { name: 'Create employee' }));

    expect(create).toHaveBeenCalledWith({
      name: 'Maria',
      email: 'someone@example.com',
      department: 'IT',
      role: 'Developer',
      salary: 50000,
      address: 'Mainz',
    });
    expect(await screen.findByText('Other page')).toBeInTheDocument();
  });

  it('shows a 409 conflict next to the name field', async () => {
    const user = userEvent.setup();
    create.mockRejectedValue(new ApiError('CONFLICT', "Employee 'Jose' already exists", 409, 'CONFLICT'));
    renderWithAuth(<EmployeeCreatePage />, { user: managerUser, route: '/employees/new', path: '/employees/new' });

    await fillForm(user, 'Jose');
    await user.click(screen.getByRole('button', { name: 'Create employee' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save: already exists');
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription(
      "Must match the Keycloak username for the employee to sign in. Employee 'Jose' already exists",
    );
  });

  it('does not submit an incomplete form', async () => {
    const user = userEvent.setup();
    renderWithAuth(<EmployeeCreatePage />, { user: managerUser, route: '/employees/new', path: '/employees/new' });

    await user.click(screen.getByRole('button', { name: 'Create employee' }));

    expect(create).not.toHaveBeenCalled();
    expect(screen.getByText('Salary is required.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveFocus();
  });
});
