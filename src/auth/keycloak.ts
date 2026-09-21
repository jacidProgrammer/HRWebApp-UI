import Keycloak from 'keycloak-js';
import { config } from '../config';

export const keycloak = new Keycloak({
  url: config.keycloak.url,
  realm: config.keycloak.realm,
  clientId: config.keycloak.clientId,
});

/** Refresh the access token when it has less than this many seconds left. */
export const MIN_TOKEN_VALIDITY_SECONDS = 30;

let initialization: Promise<boolean> | null = null;

/**
 * Starts the authorization code flow with PKCE and redirects to the Keycloak login page if there is no
 * session. Memoised: keycloak-js must only be initialised once, and React StrictMode runs effects twice.
 */
export function initKeycloak(): Promise<boolean> {
  initialization ??= keycloak
    .init({
      onLoad: 'login-required',
      flow: 'standard',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    })
    .catch((error: unknown) => {
      initialization = null;
      throw error;
    });
  return initialization;
}

/** Returns a token valid for at least {@link MIN_TOKEN_VALIDITY_SECONDS}, refreshing it if needed. */
export async function getFreshToken(): Promise<string | undefined> {
  await keycloak.updateToken(MIN_TOKEN_VALIDITY_SECONDS);
  return keycloak.token;
}

export function login(): void {
  void keycloak.login();
}

export function logout(): void {
  void keycloak.logout({ redirectUri: window.location.origin });
}
