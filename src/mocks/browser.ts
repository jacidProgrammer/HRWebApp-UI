import { setupWorker } from 'msw/browser';
import { http } from '../api/http';
import { config } from '../config';
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
    await setupWorker(...handlers).start({ onUnhandledRequest: 'bypass', quiet: true });
  } catch (error) {
    console.warn('[demo] Service worker unavailable, serving the mock API in the page instead.', error);
    http.defaults.adapter = createInPageAdapter(handlers);
  }
}
