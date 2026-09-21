import { setupWorker } from 'msw/browser';
import { http } from '../api/http';
import { BASE_PATH, config } from '../config';
import { MockDb } from './db';
import { createHandlers } from './handlers';
import { createInPageAdapter } from './inPageAdapter';

/**
 * Starts the mock API (demo mode only). The handlers normally run behind MSW's service worker; if the
 * browser won't register it, the same handlers answer in the page instead.
 */
export async function startMockApi(): Promise<void> {
  const db = new MockDb({ persist: true });
  const handlers = createHandlers(db, { baseUrl: config.apiBaseUrl, latency: 350 });
  try {
    // Under a sub-path (the GitHub Pages demo) the worker script and its scope live under that path too.
    await setupWorker(...handlers).start({
      onUnhandledRequest: 'bypass',
      quiet: true,
      serviceWorker: { url: `${BASE_PATH}mockServiceWorker.js`, options: { scope: BASE_PATH } },
    });
  } catch (error) {
    console.warn('[demo] Service worker unavailable, serving the mock API in the page instead.', error);
    http.defaults.adapter = createInPageAdapter(handlers);
  }
}
