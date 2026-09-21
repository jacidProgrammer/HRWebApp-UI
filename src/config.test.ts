import { describe, expect, it } from 'vitest';
import { MOCK_API_BASE_URL, normaliseBasePath, resolveConfig, routerBasename } from './config';

describe('resolveConfig', () => {
  it('uses the defaults of the backend docker-compose setup', () => {
    expect(resolveConfig(undefined, {})).toEqual({
      authMode: 'keycloak',
      apiBaseUrl: 'http://localhost:8080',
      keycloak: { url: 'http://localhost:8082', realm: 'hr-realm', clientId: 'hr-api-login' },
    });
  });

  it('prefers the runtime config written at container start over build-time values', () => {
    const resolved = resolveConfig(
      { API_BASE_URL: 'https://api.example.com/', KEYCLOAK_REALM: ' prod ' },
      { VITE_API_BASE_URL: 'http://localhost:9999', VITE_KEYCLOAK_REALM: 'dev' },
    );

    expect(resolved.apiBaseUrl).toBe('https://api.example.com');
    expect(resolved.keycloak.realm).toBe('prod');
  });

  it('ignores blank runtime values', () => {
    expect(resolveConfig({ API_BASE_URL: '  ' }, { VITE_API_BASE_URL: 'http://api.local' }).apiBaseUrl).toBe(
      'http://api.local',
    );
  });

  it('enables demo mode from AUTH_MODE, VITE_AUTH_MODE or the "mock" Vite mode, and then uses the mock API', () => {
    expect(resolveConfig({ AUTH_MODE: 'MOCK' }, {}).authMode).toBe('mock');
    expect(resolveConfig(undefined, { VITE_AUTH_MODE: 'mock' }).authMode).toBe('mock');
    expect(resolveConfig(undefined, { MODE: 'mock' })).toMatchObject({ authMode: 'mock', apiBaseUrl: MOCK_API_BASE_URL });
    expect(resolveConfig({ AUTH_MODE: 'keycloak' }, { MODE: 'mock' }).authMode).toBe('keycloak');
  });
});

describe('base path', () => {
  it('normalises the Vite base to a leading and trailing slash', () => {
    expect(normaliseBasePath(undefined)).toBe('/');
    expect(normaliseBasePath('/')).toBe('/');
    expect(normaliseBasePath('HRWebApp-UI')).toBe('/HRWebApp-UI/');
    expect(normaliseBasePath('/HRWebApp-UI/')).toBe('/HRWebApp-UI/');
  });

  it('gives React Router a basename without the trailing slash', () => {
    expect(routerBasename('/')).toBe('/');
    expect(routerBasename('/HRWebApp-UI/')).toBe('/HRWebApp-UI');
  });

  it('keeps the mock API under the base path, so the service worker scope covers it', () => {
    expect(MOCK_API_BASE_URL).toBe('/mock-api');
  });
});
