import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { restoreApi, useMockApi } from '../../test/mockApi';
import { employeeUser, renderWithProviders } from '../../test/render';
import { MyProfilePage } from './MyProfilePage';

afterEach(restoreApi);

describe('MyProfilePage', () => {
  it('shows private details and saves new contact details', async () => {
    const api = useMockApi('jose');
    const user = userEvent.setup();
    renderWithProviders(<MyProfilePage />, { user: employeeUser, route: '/profile' });

    const email = await screen.findByRole('textbox', { name: /Email/ });
    expect(screen.getByText('Private details')).toBeInTheDocument();
    expect(screen.getByText('€75,600')).toBeInTheDocument();

    await user.clear(email);
    await user.type(email, 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/Enter a valid email/)).toBeInTheDocument();

    await user.clear(email);
    await user.type(email, 'jose.antonio@example.com');
    const address = screen.getByRole('textbox', { name: /Address/ });
    await user.clear(address);
    await user.type(address, 'Wiesbaden, Germany');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Profile updated')).toBeInTheDocument();
    const saved = api.db.data.employees.find((e) => e.username === 'jose');
    expect(saved).toMatchObject({ email: 'jose.antonio@example.com', address: 'Wiesbaden, Germany', salary: 75600 });
  });
});
