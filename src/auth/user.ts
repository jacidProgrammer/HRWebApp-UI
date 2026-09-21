import { isRole, type Role } from './roles';

export interface AuthUser {
  /** Keycloak `preferred_username`; the backend links it (case-insensitively) to an employee's `username`. */
  username: string;
  displayName: string;
  email: string | null;
  roles: Role[];
}

/** The subset of Keycloak access-token claims the UI relies on. */
export interface TokenClaims {
  preferred_username?: string;
  name?: string;
  given_name?: string;
  email?: string;
  realm_access?: { roles?: string[] };
}

export function userFromToken(claims: TokenClaims | undefined): AuthUser {
  const username = claims?.preferred_username ?? '';
  const roles = (claims?.realm_access?.roles ?? []).filter(isRole);
  return {
    username,
    displayName: claims?.name?.trim() || claims?.given_name?.trim() || username,
    email: claims?.email ?? null,
    roles,
  };
}

/** Whether an employee username belongs to the signed-in user (same rule as the backend). */
export function isSameUser(user: AuthUser, employeeUsername: string | null | undefined): boolean {
  return !!employeeUsername && !!user.username && user.username.toLowerCase() === employeeUsername.toLowerCase();
}
