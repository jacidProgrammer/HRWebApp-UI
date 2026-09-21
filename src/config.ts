/**
 * Runtime configuration read from the Vite environment (see .env.example).
 * The defaults match the HRWebApp docker-compose setup, so the app also starts without a .env file.
 */
function read(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, '') : fallback;
}

export const config = {
  apiBaseUrl: read(import.meta.env.VITE_API_BASE_URL, 'http://localhost:8080'),
  keycloak: {
    url: read(import.meta.env.VITE_KEYCLOAK_URL, 'http://localhost:8082'),
    realm: read(import.meta.env.VITE_KEYCLOAK_REALM, 'hr-realm'),
    clientId: read(import.meta.env.VITE_KEYCLOAK_CLIENT_ID, 'hr-api-login'),
  },
} as const;
