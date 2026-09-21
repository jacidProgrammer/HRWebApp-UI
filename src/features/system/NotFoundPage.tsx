import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../../components/shell/pageTitle';
import { EmptyState } from '../../components/ui/EmptyState';
import { useI18n } from '../../i18n/context';

export function NotFoundPage() {
  const { t } = useI18n();
  usePageTitle(t('notFound.title'));
  return (
    <EmptyState
      icon={Compass}
      tone="neutral"
      title={t('notFound.heading')}
      action={
        <Link to="/" className="btn btn--primary">
          {t('notFound.home')}
        </Link>
      }
    >
      {t('notFound.body')}
    </EmptyState>
  );
}
