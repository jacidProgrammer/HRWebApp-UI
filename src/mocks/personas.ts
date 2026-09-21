import type { Role } from '../auth/roles';

export interface MockPersona {
  username: string;
  displayName: string;
  roles: Role[];
}

/** Demo users, mirroring the Keycloak demo realm of the backend. The manager has no employee record. */
export const MOCK_PERSONAS: readonly MockPersona[] = [
  { username: 'manager', displayName: 'Alex Morgan', roles: ['MANAGER'] },
  { username: 'jose', displayName: 'José Antonio', roles: ['EMPLOYEE'] },
  { username: 'louisa', displayName: 'Louisa Becker', roles: ['EMPLOYEE'] },
  { username: 'maria', displayName: 'Maria Rossi', roles: ['EMPLOYEE'] },
  { username: 'lukas', displayName: 'Lukas Hoffmann', roles: ['EMPLOYEE'] },
];

const TOKEN_PREFIX = 'mock.';

/** The fake bearer token sent in demo mode; the mock API resolves it back to a persona. */
export const mockToken = (username: string) => `${TOKEN_PREFIX}${username}`;

export function personaFromAuthorization(header: string | null): MockPersona | undefined {
  const token = header?.replace(/^Bearer\s+/i, '') ?? '';
  if (!token.startsWith(TOKEN_PREFIX)) return undefined;
  const username = token.slice(TOKEN_PREFIX.length).toLowerCase();
  return MOCK_PERSONAS.find((persona) => persona.username === username);
}

export const findPersona = (username: string | null) => MOCK_PERSONAS.find((persona) => persona.username === username);
