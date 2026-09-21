import { createContext } from 'react';
import type { Role } from './roles';
import type { AuthUser } from './user';

export interface AuthContextValue {
  user: AuthUser;
  hasRole: (role: Role) => boolean;
  /** Whether the given employee name is the signed-in user. */
  isSelf: (employeeName: string | null | undefined) => boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
