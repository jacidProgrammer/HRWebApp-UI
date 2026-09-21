import { describe, expect, it } from 'vitest';
import { isSameUser, userFromToken } from './user';

describe('userFromToken', () => {
  it('reads the username, display name and the realm roles the backend knows', () => {
    const user = userFromToken({
      preferred_username: 'jose',
      name: 'José Antonio',
      email: 'jose@example.com',
      realm_access: { roles: ['default-roles-hr-realm', 'offline_access', 'EMPLOYEE'] },
    });

    expect(user).toEqual({ username: 'jose', displayName: 'José Antonio', email: 'jose@example.com', roles: ['EMPLOYEE'] });
  });

  it('falls back to the username and no roles when claims are missing', () => {
    expect(userFromToken({ preferred_username: 'manager' })).toEqual({
      username: 'manager',
      displayName: 'manager',
      email: null,
      roles: [],
    });
  });
});

describe('isSameUser', () => {
  it('matches the employee username case-insensitively, like the backend', () => {
    const user = userFromToken({ preferred_username: 'jose' });

    expect(isSameUser(user, 'Jose')).toBe(true);
    expect(isSameUser(user, 'louisa')).toBe(false);
    expect(isSameUser(user, null)).toBe(false);
  });

  it('never matches when the token has no username', () => {
    expect(isSameUser(userFromToken({}), '')).toBe(false);
  });
});
