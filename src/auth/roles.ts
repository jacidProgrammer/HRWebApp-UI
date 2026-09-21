/** Keycloak realm roles understood by the backend. */
export const Role = {
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

const KNOWN_ROLES: readonly string[] = Object.values(Role);

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && KNOWN_ROLES.includes(value);
}
