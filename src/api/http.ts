import axios, { type AxiosInstance } from 'axios';
import { config } from '../config';
import { toApiError, unauthorizedError } from './errors';

/**
 * Requests wait for this before they are sent. Demo mode sets it to the start-up of the in-browser mock
 * API, so the app can render while the mock loads instead of after it.
 */
let requestGate: Promise<unknown> = Promise.resolve();

export function holdRequestsUntil(ready: Promise<unknown>): void {
  requestGate = ready;
}

export interface AuthHandlers {
  /** Returns a valid access token, refreshing it first if it is about to expire. Rejects if it cannot. */
  getToken: () => Promise<string | undefined>;
  /** Called when the backend rejects the token (401) or it cannot be refreshed: start a new login. */
  onUnauthorized: () => void;
}

/**
 * Axios instance for the HRWebApp API: adds the bearer token to every request and rejects with an
 * {@link ApiError} instead of raw Axios errors.
 */
export function createHttpClient(baseURL: string, auth: AuthHandlers): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 15_000,
    headers: { Accept: 'application/json' },
  });

  instance.interceptors.request.use(async (request) => {
    await requestGate;
    let token: string | undefined;
    try {
      token = await auth.getToken();
    } catch {
      throw unauthorizedError();
    }
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const apiError = toApiError(error);
      if (apiError.kind === 'UNAUTHORIZED') {
        auth.onUnauthorized();
      }
      return Promise.reject(apiError);
    },
  );

  return instance;
}

let currentAuth: AuthHandlers = {
  getToken: () => Promise.resolve(undefined),
  onUnauthorized: () => undefined,
};

/** Connects the shared client to the signed-in session (called by the AuthProvider). */
export function setAuthHandlers(handlers: AuthHandlers): void {
  currentAuth = handlers;
}

export const http = createHttpClient(config.apiBaseUrl, {
  getToken: () => currentAuth.getToken(),
  onUnauthorized: () => currentAuth.onUnauthorized(),
});
