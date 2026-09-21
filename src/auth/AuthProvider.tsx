import { lazy, type ReactNode } from 'react';
import { config } from '../config';
import { KeycloakAuthProvider } from './KeycloakAuthProvider';

// Demo mode never loads in a normal deployment unless AUTH_MODE=mock.
const MockAuthProvider = lazy(() => import('./MockAuthProvider'));

/** Keycloak in real deployments, a role picker in demo mode. */
export function AuthProvider({ children }: { children: ReactNode }) {
  return config.authMode === 'mock' ? (
    <MockAuthProvider>{children}</MockAuthProvider>
  ) : (
    <KeycloakAuthProvider>{children}</KeycloakAuthProvider>
  );
}
