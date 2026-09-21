import { UserX } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { usePageTitle } from '../../components/shell/pageTitle';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../auth/useAuth';
import { useI18n } from '../../i18n/context';

/** "/" sends managers to the dashboard and employees to their recognition. */
export function HomeRedirect() {
  const { hasRole } = useAuth();
  const { t } = useI18n();
  const redirecting = hasRole('MANAGER') || hasRole('EMPLOYEE');
  usePageTitle(redirecting ? '' : t('noRole.title'));
  if (hasRole('MANAGER')) return <Navigate to="/dashboard" replace />;
  if (hasRole('EMPLOYEE')) return <Navigate to="/recognition" replace />;
  return (
    <EmptyState icon={UserX} tone="neutral" title={t('noRole.title')}>
      {t('noRole.body')}
    </EmptyState>
  );
}
