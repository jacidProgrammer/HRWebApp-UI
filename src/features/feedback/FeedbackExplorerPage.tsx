import { FilterX, MessagesSquare } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEmployees, useFeedbackList } from '../../api/hooks';
import type { Feedback, FeedbackQuery, SentimentFilter } from '../../api/types';
import { usePageTitle } from '../../components/shell/pageTitle';
import { ErrorState } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { PersonCombobox } from '../../components/ui/PersonCombobox';
import { SkeletonList } from '../../components/ui/Skeleton';
import { useI18n } from '../../i18n/context';
import { countSentiment } from '../people/sentimentCounts';
import { departmentsOf } from '../people/peopleView';
import { FeedbackList } from '../recognition/FeedbackCard';
import { activeFilterCount, readFeedbackFilters, writeFeedbackFilters } from './feedbackFilters';
import './FeedbackExplorerPage.css';

const SENTIMENT_OPTIONS: SentimentFilter[] = ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'NONE'];
const PAGE_SIZE = 20;

/** Renders the results a page at a time, so a long history stays quick to scan. Remounted per filter set. */
function PagedFeedback({ items }: { items: Feedback[] }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const remaining = items.length - visible;
  return (
    <>
      <FeedbackList items={items.slice(0, visible)} perspective="all" />
      {remaining > 0 && (
        <div className="explorer__more">
          <button type="button" className="btn btn--secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            {t('explorer.showMore', { count: Math.min(PAGE_SIZE, remaining) })}
          </button>
          <p className="explorer__more-note">{t('explorer.showing', { shown: visible, total: items.length })}</p>
        </div>
      )}
    </>
  );
}

export default function FeedbackExplorerPage() {
  const { t, tp } = useI18n();
  usePageTitle(t('explorer.title'));
  const [params, setParams] = useSearchParams();
  const query = readFeedbackFilters(params);
  const setQuery = (patch: Partial<FeedbackQuery>) => setParams(writeFeedbackFilters({ ...query, ...patch }), { replace: true });

  const employees = useEmployees();
  const feedback = useFeedbackList(query);
  const departments = useMemo(() => departmentsOf(employees.data ?? []), [employees.data]);
  const people = useMemo(
    () => (employees.data ?? []).filter((e) => !query.department || e.department === query.department),
    [employees.data, query.department],
  );
  const counts = feedback.data ? countSentiment(feedback.data) : null;
  const filters = activeFilterCount(query);

  return (
    <div className="page">
      <p className="page-intro__text">{t('explorer.intro')}</p>

      <section className="card filters" aria-labelledby="filters-heading">
        <h2 id="filters-heading" className="visually-hidden">
          {t('explorer.filters')}
        </h2>
        <div className="filters__grid">
          <div className="field">
            <label className="field__label" htmlFor="filter-dept">
              {t('field.department')}
            </label>
            <select id="filter-dept" className="input" value={query.department ?? ''} onChange={(e) => setQuery({ department: e.target.value || undefined, recipientId: undefined })}>
              <option value="">{t('people.allDepartments')}</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="filter-sentiment">
              {t('explorer.sentiment')}
            </label>
            <select id="filter-sentiment" className="input" value={query.sentiment ?? ''} onChange={(e) => setQuery({ sentiment: (e.target.value || undefined) as SentimentFilter | undefined })}>
              <option value="">{t('explorer.anySentiment')}</option>
              {SENTIMENT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {t(`sentiment.${s}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="filters__person">
            <PersonCombobox
              label={t('explorer.person')}
              placeholder={t('explorer.anyone')}
              people={people}
              value={query.recipientId ?? null}
              onChange={(id) => setQuery({ recipientId: id ?? undefined })}
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="filter-from">
              {t('explorer.from')}
            </label>
            <input id="filter-from" type="date" className="input" value={query.from ?? ''} max={query.to} onChange={(e) => setQuery({ from: e.target.value || undefined })} />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="filter-to">
              {t('explorer.to')}
            </label>
            <input id="filter-to" type="date" className="input" value={query.to ?? ''} min={query.from} onChange={(e) => setQuery({ to: e.target.value || undefined })} />
          </div>
        </div>
      </section>

      <div className="results-bar">
        <p className="results-bar__count" aria-live="polite">
          {feedback.data ? tp('feedback.count', feedback.data.length) : ' '}
          {counts && counts.total > 0 && (
            <span className="results-bar__split">
              <span className="dot dot--positive" aria-hidden="true" /> {counts.positive}
              <span className="dot dot--neutral" aria-hidden="true" /> {counts.neutral}
              <span className="dot dot--negative" aria-hidden="true" /> {counts.negative}
              <span className="visually-hidden">
                ({t('sentiment.POSITIVE')} {counts.positive}, {t('sentiment.NEUTRAL')} {counts.neutral}, {t('sentiment.NEGATIVE')} {counts.negative})
              </span>
            </span>
          )}
        </p>
        {filters > 0 && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setParams({}, { replace: true })}>
            <FilterX size={14} aria-hidden="true" />
            {t('common.clearFilters')} ({filters})
          </button>
        )}
      </div>

      {feedback.isPending ? (
        <SkeletonList rows={4} />
      ) : feedback.isError ? (
        <ErrorState error={feedback.error} onRetry={() => void feedback.refetch()} />
      ) : feedback.data.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={MessagesSquare}
            tone="neutral"
            title={filters ? t('explorer.noMatches.title') : t('explorer.empty.title')}
            action={
              filters ? (
                <button type="button" className="btn btn--secondary" onClick={() => setParams({}, { replace: true })}>
                  {t('common.clearFilters')}
                </button>
              ) : undefined
            }
          >
            {filters ? t('explorer.noMatches.body') : t('explorer.empty.body')}
          </EmptyState>
        </div>
      ) : (
        <div className={feedback.isPlaceholderData ? 'is-stale' : undefined}>
          <PagedFeedback key={params.toString()} items={feedback.data} />
        </div>
      )}
    </div>
  );
}
