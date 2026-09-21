import { lazy, type ReactNode } from 'react';
import { config } from '../config';

// Each mode loads only its own provider: keycloak-js is never downloaded in demo mode, and the demo never
// loads in a normal deployment unless AUTH_MODE=mock.
const KeycloakAuthProvider = lazy(() => import('./KeycloakAuthProvider').then((module) => ({ default: module.KeycloakAuthProvider })));
const MockAuthProvider = lazy(() => import('./MockAuthProvider'));

/** Keycloak in real deployments, a role picker in demo mode. */
export function AuthProvider({ children }: { children: ReactNode }) {
  return config.authMode === 'mock' ? (
    <MockAuthProvider>{children}</MockAuthProvider>
  ) : (
    <KeycloakAuthProvider>{children}</KeycloakAuthProvider>
  );
}
