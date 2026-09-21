import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { restoreApi, useMockApi } from '../../test/mockApi';
import { managerUser, renderWithProviders } from '../../test/render';
import SettingsPage, { PRIVACY_DOCS_URL } from './SettingsPage';

afterEach(restoreApi);

describe('SettingsPage', () => {
  it('turns AI analysis off and on', async () => {
    const api = useMockApi('manager');
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />, { user: managerUser, route: '/settings' });

    const toggle = await screen.findByRole('switch', { name: 'AI sentiment analysis' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(await screen.findByText('AI sentiment analysis turned off')).toBeInTheDocument();
    expect(api.db.data.settings.sentimentAnalysisEnabled).toBe(false);

    await waitFor(() => expect(toggle).toBeEnabled());
    await user.click(toggle);
    expect(await screen.findByText('AI sentiment analysis turned on')).toBeInTheDocument();
    expect(api.db.data.settings.sentimentAnalysisEnabled).toBe(true);
  });

  it('warns when the model is not configured', async () => {
    const api = useMockApi('manager');
    api.db.data.settings = { sentimentAnalysisEnabled: true, sentimentAnalysisAvailable: false };
    renderWithProviders(<SettingsPage />, { user: managerUser, route: '/settings' });

    expect(await screen.findByText('The model isn’t configured')).toBeInTheDocument();
    expect(screen.getByText('Not configured')).toBeInTheDocument();
  });

  it('links to the backend privacy notes', async () => {
    useMockApi('manager');
    renderWithProviders(<SettingsPage />, { user: managerUser, route: '/settings' });
    expect(await screen.findByRole('link', { name: /Read the backend privacy notes/ })).toHaveAttribute('href', PRIVACY_DOCS_URL);
  });
});
