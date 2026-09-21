import { ShieldOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { useI18n } from '../i18n/context';
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
  const { t } = useI18n();
  if (anyOf.some(hasRole)) return <>{children}</>;
  if (fallback !== undefined) return <>{fallback}</>;
  return (
    <EmptyState
      icon={ShieldOff}
      tone="danger"
      headingLevel={1}
      title={t('forbidden.title')}
      action={
        <Link className="btn btn--secondary" to="/">
          {t('forbidden.back')}
        </Link>
      }
    >
      {t('forbidden.body', { roles: anyOf.join(' / ') })}
    </EmptyState>
  );
}
