import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { Suspense, useState, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createQueryClient } from '../api/queryClient';
import { AuthProvider } from '../auth/AuthProvider';
import { ToastProvider } from '../components/ui/Toast';
import { ErrorBoundary } from '../features/system/ErrorBoundary';
import { I18nProvider } from '../i18n/I18nProvider';
import { ThemeProvider } from '../theme/ThemeProvider';

/** Last-resort fallback, rendered even if the i18n layer itself failed. */
const CRASH = (
  <main style={{ padding: 32, fontFamily: 'system-ui' }} role="alert">
    <h1>Something went wrong</h1>
    <p>Please reload the page.</p>
    <button type="button" onClick={() => window.location.reload()}>
      Reload
    </button>
  </main>
);

export function Providers({ children, queryClient }: { children: ReactNode; queryClient?: QueryClient }) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return (
    <ErrorBoundary fallback={CRASH}>
      <I18nProvider>
        <ThemeProvider>
          <QueryClientProvider client={client}>
            <ToastProvider>
              <Suspense fallback={null}>
                <AuthProvider>
                  <BrowserRouter>{children}</BrowserRouter>
                </AuthProvider>
              </Suspense>
            </ToastProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
