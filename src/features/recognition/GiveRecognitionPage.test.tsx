import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { restoreApi, useMockApi } from '../../test/mockApi';
import { employeeUser, renderWithProviders } from '../../test/render';
import { GiveRecognitionPage } from './GiveRecognitionPage';

afterEach(restoreApi);

describe('GiveRecognitionPage', () => {
  it('validates like the backend before sending', async () => {
    useMockApi('jose');
    const user = userEvent.setup();
    renderWithProviders(<GiveRecognitionPage />, { user: employeeUser, route: '/recognition/give' });
    await screen.findByText(/analysed by an AI sentiment model/i);

    await user.click(screen.getByRole('button', { name: 'Send recognition' }));

    expect(screen.getByText('Choose who you want to recognise.')).toBeInTheDocument();
    expect(screen.getByText('Write a message.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('combobox', { name: /Colleague/ })).toHaveFocus());
  });

  it('only shows the character counter near the limit', async () => {
    useMockApi('jose');
    const user = userEvent.setup();
    renderWithProviders(<GiveRecognitionPage />, { user: employeeUser, route: '/recognition/give' });
    const message = screen.getByRole('textbox', { name: /Message/ });

    await user.type(message, 'Great demo!');
    expect(screen.queryByText(/characters left/)).not.toBeInTheDocument();

    await user.click(message);
    await user.paste('x'.repeat(480));
    expect(screen.getByText('9 characters left')).toBeInTheDocument();
  });

  it('sends anonymous recognition and opens the Sent tab', async () => {
    const api = useMockApi('jose');
    const user = userEvent.setup();
    renderWithProviders(<GiveRecognitionPage />, { user: employeeUser, route: '/recognition/give' });
    const sentBefore = api.db.data.feedback.length;

    const combobox = await screen.findByRole('combobox', { name: /Colleague/ });
    await user.type(combobox, 'Louisa');
    await user.click(await screen.findByRole('option', { name: /Louisa Becker/ }));
    await user.click(screen.getByRole('button', { name: /Teamwork/ }));
    await user.type(screen.getByRole('textbox', { name: /Message/ }), 'Thanks for covering my on-call shift!');
    await user.click(screen.getByRole('switch', { name: 'Send anonymously' }));
    await user.click(screen.getByRole('button', { name: 'Send recognition' }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/recognition?tab=sent'));
    expect(await screen.findByText('Recognition sent to Louisa Becker')).toBeInTheDocument();
    expect(api.db.data.feedback).toHaveLength(sentBefore + 1);
    const created = api.db.data.feedback.find((f) => f.message === 'Thanks for covering my on-call shift!');
    expect(created).toMatchObject({ anonymous: true, value: 'TEAMWORK' });
  });

  it('does not offer the author as a recipient', async () => {
    useMockApi('jose');
    const user = userEvent.setup();
    renderWithProviders(<GiveRecognitionPage />, { user: employeeUser, route: '/recognition/give' });

    await user.type(await screen.findByRole('combobox', { name: /Colleague/ }), 'José');

    expect(await screen.findByText('No colleagues match your search.')).toBeInTheDocument();
  });
});
