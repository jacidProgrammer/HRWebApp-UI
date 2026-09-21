/**
 * Runtime configuration.
 *
 * In a container, `/config.js` (generated at start-up from environment variables, see docker/) defines
 * `window.__APP_CONFIG__`, so one image can be deployed anywhere. During development that file is empty
 * and the `VITE_*` variables from `.env` (or the defaults below) apply.
 */
export type AuthMode = 'keycloak' | 'mock';

export interface AppConfig {
  apiBaseUrl: string;
  authMode: AuthMode;
  keycloak: { url: string; realm: string; clientId: string };
}

export interface RuntimeConfig {
  API_BASE_URL?: string;
  KEYCLOAK_URL?: string;
  KEYCLOAK_REALM?: string;
  KEYCLOAK_CLIENT_ID?: string;
  AUTH_MODE?: string;
}

export interface BuildEnv {
  MODE?: string;
  VITE_API_BASE_URL?: string;
  VITE_KEYCLOAK_URL?: string;
  VITE_KEYCLOAK_REALM?: string;
  VITE_KEYCLOAK_CLIENT_ID?: string;
  VITE_AUTH_MODE?: string;
}

/** Base URL of the in-browser mock API. Same-origin, so demo mode never calls a real server. */
export const MOCK_API_BASE_URL = '/mock-api';

function pick(...values: (string | undefined)[]): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

const withoutTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export function resolveConfig(runtime: RuntimeConfig | undefined, env: BuildEnv): AppConfig {
  const mode = pick(runtime?.AUTH_MODE, env.VITE_AUTH_MODE, env.MODE === 'mock' ? 'mock' : undefined);
  const authMode: AuthMode = mode?.toLowerCase() === 'mock' ? 'mock' : 'keycloak';
  return {
    authMode,
    apiBaseUrl:
      authMode === 'mock'
        ? MOCK_API_BASE_URL
        : withoutTrailingSlash(pick(runtime?.API_BASE_URL, env.VITE_API_BASE_URL) ?? 'http://localhost:8080'),
    keycloak: {
      url: withoutTrailingSlash(pick(runtime?.KEYCLOAK_URL, env.VITE_KEYCLOAK_URL) ?? 'http://localhost:8082'),
      realm: pick(runtime?.KEYCLOAK_REALM, env.VITE_KEYCLOAK_REALM) ?? 'hr-realm',
      clientId: pick(runtime?.KEYCLOAK_CLIENT_ID, env.VITE_KEYCLOAK_CLIENT_ID) ?? 'hr-api-login',
    },
  };
}

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig;
  }
}

export const config: AppConfig = resolveConfig(
  typeof window === 'undefined' ? undefined : window.__APP_CONFIG__,
  import.meta.env,
);
