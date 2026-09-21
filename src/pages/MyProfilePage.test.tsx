import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { employeesApi } from '../api/employees';
import { ApiError } from '../api/errors';
import { employeeUser, hidden, jose, louisa, makeUser, renderWithAuth } from '../test/render';
import { MyProfilePage } from './MyProfilePage';

vi.mock('../api/employees', () => ({
  employeesApi: { list: vi.fn(), updateContactDetails: vi.fn() },
}));

const list = vi.mocked(employeesApi.list);
const updateContactDetails = vi.mocked(employeesApi.updateContactDetails);

describe('MyProfilePage', () => {
  beforeEach(() => {
    list.mockResolvedValue([hidden(louisa), jose]);
  });

  it('finds the own record by username (case-insensitive) and only offers email and address', async () => {
    renderWithAuth(<MyProfilePage />, { user: employeeUser });

    expect(await screen.findByLabelText('Email')).toHaveValue('jose@example.com');
    expect(screen.getByLabelText('Address')).toHaveValue('Mainz, Germany');
    expect(screen.getByText('Java Senior Backend')).toBeInTheDocument();
    expect(screen.queryByLabelText('Department')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Salary')).not.toBeInTheDocument();
  });

  it('sends only the contact details and confirms the update', async () => {
    const user = userEvent.setup();
    updateContactDetails.mockResolvedValue({ ...jose, email: 'jose@new.example' });
    renderWithAuth(<MyProfilePage />, { user: employeeUser });

    const email = await screen.findByLabelText('Email');
    await user.clear(email);
    await user.type(email, 'jose@new.example');
    await user.click(screen.getByRole('button', { name: 'Save contact details' }));

    expect(updateContactDetails).toHaveBeenCalledWith('Jose', { email: 'jose@new.example', address: 'Mainz, Germany' });
    expect(await screen.findByText('Your contact details were updated.')).toBeInTheDocument();
  });

  it('validates the form before calling the API', async () => {
    const user = userEvent.setup();
    renderWithAuth(<MyProfilePage />, { user: employeeUser });

    const email = await screen.findByLabelText('Email');
    await user.clear(email);
    await user.type(email, 'not-an-email');
    await user.clear(screen.getByLabelText('Address'));
    await user.click(screen.getByRole('button', { name: 'Save contact details' }));

    expect(updateContactDetails).not.toHaveBeenCalled();
    expect(email).toHaveAccessibleDescription('Enter a valid email address.');
    expect(screen.getByLabelText('Address')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows a 403 from the backend inline', async () => {
    const user = userEvent.setup();
    updateContactDetails.mockRejectedValue(
      new ApiError('FORBIDDEN', 'You can only update your own profile', 403, 'FORBIDDEN'),
    );
    renderWithAuth(<MyProfilePage />, { user: employeeUser });

    await user.click(await screen.findByRole('button', { name: 'Save contact details' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Could not save: not allowed');
    expect(alert).toHaveTextContent('You can only update your own profile');
  });

  it('explains when the account has no employee record', async () => {
    renderWithAuth(<MyProfilePage />, { user: makeUser('newcomer', ['EMPLOYEE']) });

    expect(await screen.findByText('Your account is not linked to an employee record')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save contact details' })).not.toBeInTheDocument();
  });
});
