import type { AxiosAdapter } from 'axios';
import { delay, http as httpHandler, HttpResponse, type HttpHandler } from 'msw';
import { http, setAuthHandlers } from '../api/http';
import { config } from '../config';
import { MockDb } from '../mocks/db';
import { createHandlers } from '../mocks/handlers';
import { createInPageAdapter } from '../mocks/inPageAdapter';
import { mockToken } from '../mocks/personas';

const originalAdapter = http.defaults.adapter;

/** A fixed clock, so the seeded demo data (and the stats derived from it) are the same on every run. */
export const TEST_NOW = new Date('2026-06-15T10:00:00Z');

export interface MockApi {
  db: MockDb;
  /** Makes the next matching request answer with the given status and body instead. */
  fail: (method: 'get' | 'post' | 'put' | 'delete', path: string, status: number, body?: unknown, latency?: number) => void;
}

/**
 * Serves the demo-mode API (the same MSW handlers the browser demo uses) to the shared axios client, signed
 * in as `username`. Call {@link restoreApi} in `afterEach`.
 */
export function useMockApi(username: string): MockApi {
  const db = new MockDb({ now: TEST_NOW });
  const overrides: HttpHandler[] = [];
  const build = (): AxiosAdapter =>
    createInPageAdapter([...overrides, ...createHandlers(db, { baseUrl: config.apiBaseUrl, now: () => TEST_NOW })]);

  setAuthHandlers({ getToken: () => Promise.resolve(mockToken(username)), onUnauthorized: () => undefined });
  http.defaults.adapter = build();

  return {
    db,
    fail(method, path, status, body, latency = 0) {
      overrides.unshift(
        httpHandler[method](
          `${config.apiBaseUrl}${path}`,
          async () => {
            if (latency) await delay(latency);
            return body === undefined ? new HttpResponse(null, { status }) : HttpResponse.json(body as object, { status });
          },
          { once: true },
        ),
      );
      http.defaults.adapter = build();
    },
  };
}

export function restoreApi(): void {
  http.defaults.adapter = originalAdapter;
  setAuthHandlers({ getToken: () => Promise.resolve(undefined), onUnauthorized: () => undefined });
}
