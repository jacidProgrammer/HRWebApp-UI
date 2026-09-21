import { Award, Inbox, Send, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMyEmployee, useReceivedFeedback, useSentFeedback } from '../../api/hooks';
import { useAuth } from '../../auth/useAuth';
import { usePageTitle } from '../../components/shell/pageTitle';
import { ErrorState } from '../../components/ui/Alert';
import { ValueTag } from '../../components/ui/Chips';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { Tabs } from '../../components/ui/Tabs';
import { useI18n } from '../../i18n/context';
import { FeedbackList } from './FeedbackCard';
import { topValue } from './topValue';
import './MyRecognitionPage.css';

type Tab = 'received' | 'sent';

export function MyRecognitionPage() {
  const { t, tp } = useI18n();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'sent' ? 'sent' : 'received';
  usePageTitle(t('recognition.title'));

  const me = useMyEmployee();
  const received = useReceivedFeedback();
  const sent = useSentFeedback();
  const active = tab === 'received' ? received : sent;
  const firstName = (me.data?.name ?? user.displayName).split(' ')[0];
  const favourite = useMemo(() => topValue(received.data ?? []), [received.data]);
  const positive = (received.data ?? []).filter((f) => f.sentiment?.label === 'POSITIVE').length;

  return (
    <div className="page">
      <section className="hero-card" aria-labelledby="recognition-hello">
        <div className="hero-card__text">
          <h2 id="recognition-hello" className="hero-card__title">
            {t('recognition.hello', { name: firstName ?? '' })}
          </h2>
          <p className="hero-card__lead">{t('recognition.lead')}</p>
        </div>
        <Link to="/recognition/give" className="btn btn--primary btn--lg">
          <Send size={18} aria-hidden="true" />
          {t('recognition.give')}
        </Link>
      </section>

      <ul className="mini-stats" aria-label={t('recognition.summary')}>
        <li className="mini-stat">
          <span className="mini-stat__icon mini-stat__icon--accent" aria-hidden="true">
            <Inbox size={18} />
          </span>
          <span className="mini-stat__text">
            <span className="mini-stat__value tabular">{received.data ? received.data.length : '–'}</span>
            <span className="mini-stat__label">{t('recognition.stat.received')}</span>
          </span>
        </li>
        <li className="mini-stat">
          <span className="mini-stat__icon mini-stat__icon--teal" aria-hidden="true">
            <Sparkles size={18} />
          </span>
          <span className="mini-stat__text">
            <span className="mini-stat__value tabular">{received.data ? positive : '–'}</span>
            <span className="mini-stat__label">{t('recognition.stat.positive')}</span>
          </span>
        </li>
        <li className="mini-stat">
          <span className="mini-stat__icon mini-stat__icon--amber" aria-hidden="true">
            <Award size={18} />
          </span>
          <span className="mini-stat__text">
            <span className="mini-stat__value">{favourite ? <ValueTag value={favourite} size="sm" /> : '–'}</span>
            <span className="mini-stat__label">{t('recognition.stat.topValue')}</span>
          </span>
        </li>
      </ul>

      <section className="page" aria-label={t('recognition.title')}>
        <Tabs<Tab>
          label={t('recognition.title')}
          idPrefix="recognition"
          selected={tab}
          onSelect={(next) => setParams(next === 'received' ? {} : { tab: next }, { replace: true })}
          tabs={[
            { id: 'received', label: t('recognition.tab.received'), count: received.data?.length },
            { id: 'sent', label: t('recognition.tab.sent'), count: sent.data?.length },
          ]}
        />
        <div role="tabpanel" id={`recognition-panel-${tab}`} aria-labelledby={`recognition-tab-${tab}`} tabIndex={0} className="tabpanel">
          {active.isPending ? (
            <SkeletonList rows={3} />
          ) : active.isError ? (
            <ErrorState error={active.error} onRetry={() => void active.refetch()} />
          ) : active.data.length === 0 ? (
            tab === 'received' ? (
              <EmptyState icon={Inbox} title={t('recognition.empty.received.title')}>
                {t('recognition.empty.received.body')}
              </EmptyState>
            ) : (
              <EmptyState
                icon={Send}
                title={t('recognition.empty.sent.title')}
                action={
                  <Link to="/recognition/give" className="btn btn--primary">
                    {t('recognition.give')}
                  </Link>
                }
              >
                {t('recognition.empty.sent.body')}
              </EmptyState>
            )
          ) : (
            <>
              <p className="visually-hidden">{tp('recognition.count', active.data.length)}</p>
              <FeedbackList items={active.data} perspective={tab} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
