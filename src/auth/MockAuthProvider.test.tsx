import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '../i18n/I18nProvider';
import MockAuthProvider, { MOCK_USER_STORAGE_KEY } from './MockAuthProvider';

const renderDemo = () =>
  render(
    <I18nProvider locale="en">
      <MockAuthProvider>
        <p>Signed in</p>
      </MockAuthProvider>
    </I18nProvider>,
  );

describe('MockAuthProvider', () => {
  afterEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('shows the role picker when nobody is signed in', () => {
    renderDemo();
    expect(screen.getByRole('button', { name: /Continue as Manager/ })).toBeInTheDocument();
    expect(screen.queryByText('Signed in')).not.toBeInTheDocument();
  });

  it('signs in as the persona named in ?as= and removes the parameter', () => {
    window.history.replaceState(null, '', '/dashboard?as=manager&tab=sent#top');
    renderDemo();
    expect(screen.getByText('Signed in')).toBeInTheDocument();
    expect(window.sessionStorage.getItem(MOCK_USER_STORAGE_KEY)).toBe('manager');
    expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe('/dashboard?tab=sent#top');
  });

  it('ignores an unknown persona but still cleans the address bar', () => {
    window.history.replaceState(null, '', '/?as=root');
    renderDemo();
    expect(screen.getByRole('button', { name: /Continue as Manager/ })).toBeInTheDocument();
    expect(window.location.search).toBe('');
  });
});
