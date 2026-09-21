import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthContext } from '../auth/AuthContext';
import { createAuthValue } from '../auth/createAuthValue';
import type { Role } from '../auth/roles';
import type { AuthUser } from '../auth/user';
import { ToastProvider } from '../components/ui/Toast';
import type { Locale } from '../i18n/core';
import { I18nProvider } from '../i18n/I18nProvider';
import { ThemeProvider } from '../theme/ThemeProvider';

export function makeUser(username: string, roles: Role[], displayName = username): AuthUser {
  return { username, displayName, email: null, roles };
}

export const managerUser = makeUser('manager', ['MANAGER'], 'Alex Morgan');
/** Keycloak lower-cases usernames. */
export const employeeUser = makeUser('jose', ['EMPLOYEE'], 'José Antonio');

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
}

/** Shows the current URL, so tests can assert navigation and search params. */
export function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

interface Options {
  user?: AuthUser;
  route?: string;
  /** Route pattern the element is mounted at, e.g. "/people/:id". */
  path?: string;
  locale?: Locale;
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  { user = employeeUser, route = '/', path = '*', locale = 'en', queryClient = createTestQueryClient() }: Options = {},
): RenderResult & { logout: ReturnType<typeof vi.fn>; queryClient: QueryClient } {
  const logout = vi.fn();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <I18nProvider locale={locale}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthContext.Provider value={createAuthValue(user, logout)}>
              <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
            </AuthContext.Provider>
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nProvider>
  );
  const result = render(
    <Routes>
      <Route
        path={path}
        element={
          <>
            {ui}
            <LocationProbe />
          </>
        }
      />
      <Route path="*" element={<LocationProbe />} />
    </Routes>,
    { wrapper: Wrapper },
  );
  return { ...result, logout, queryClient };
}

