import type { AuthContextValue } from './AuthContext';
import { isSameUser, type AuthUser } from './user';

export function createAuthValue(user: AuthUser, logout: () => void): AuthContextValue {
  return {
    user,
    hasRole: (role) => user.roles.includes(role),
    isSelf: (employeeName) => isSameUser(user, employeeName),
    logout,
  };
}
