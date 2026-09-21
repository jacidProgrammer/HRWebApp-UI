import type { Feedback } from '../../api/types';
import { countSentiment } from './sentimentCounts';
import { useI18n } from '../../i18n/context';
import { useFormat } from '../../lib/format';
import './SentimentSummary.css';

const SEGMENTS = ['positive', 'neutral', 'negative', 'notAnalysed'] as const;

/** One stacked bar with a legend: how the feedback about a person splits by sentiment. */
export function SentimentSummary({ items }: { items: Feedback[] }) {
  const { t } = useI18n();
  const format = useFormat();
  const counts = countSentiment(items);
  const labels = {
    positive: t('sentiment.POSITIVE'),
    neutral: t('sentiment.NEUTRAL'),
    negative: t('sentiment.NEGATIVE'),
    notAnalysed: t('sentiment.NONE'),
  };

  return (
    <div className="sentiment-summary">
      <div className="sentiment-summary__headline">
        <span className="sentiment-summary__value tabular">
          {counts.positiveShare === null ? '–' : format.percent(counts.positiveShare)}
        </span>
        <span className="sentiment-summary__caption">{t('person.summary.positiveShare')}</span>
      </div>
      {counts.total > 0 && (
        <div className="sentiment-summary__bar" role="img" aria-label={SEGMENTS.map((s) => `${labels[s]}: ${counts[s]}`).join(', ')}>
          {SEGMENTS.filter((s) => counts[s] > 0).map((segment) => (
            <span
              key={segment}
              className={`sentiment-summary__segment sentiment-summary__segment--${segment}`}
              style={{ flexGrow: counts[segment] }}
            />
          ))}
        </div>
      )}
      <ul className="sentiment-summary__legend">
        {SEGMENTS.map((segment) => (
          <li key={segment}>
            <span className={`legend-swatch legend-swatch--${segment}`} aria-hidden="true" />
            <span className="sentiment-summary__legend-label">{labels[segment]}</span>
            <span className="tabular sentiment-summary__legend-count">{counts[segment]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
