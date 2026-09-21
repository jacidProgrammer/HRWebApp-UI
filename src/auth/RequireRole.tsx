import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Role } from './roles';
import { useAuth } from './useAuth';

interface RequireRoleProps {
  /** The user needs at least one of these roles. */
  anyOf: readonly Role[];
  children: ReactNode;
  /** Rendered instead of the children when the user lacks the role. Defaults to an access-denied page. */
  fallback?: ReactNode;
}

export function RequireRole({ anyOf, children, fallback }: RequireRoleProps) {
  const { hasRole } = useAuth();
  if (anyOf.some(hasRole)) {
    return <>{children}</>;
  }
  if (fallback !== undefined) {
    return <>{fallback}</>;
  }
  return (
    <section className="panel panel--center" aria-labelledby="forbidden-title">
      <h1 id="forbidden-title">Access denied</h1>
      <p>
        This page requires the {anyOf.join(' or ')} role. Your account doesn&apos;t have it.
      </p>
      <Link className="button" to="/employees">
        Back to employees
      </Link>
    </section>
  );
}
