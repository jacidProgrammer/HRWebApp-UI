import type { Sentiment } from '../../api/types';
import { useI18n } from '../../i18n/context';
import { useFormat } from '../../lib/format';
import './SentimentIndicator.css';

interface Props {
  sentiment: Sentiment | null;
  /** Hide the confidence bar, e.g. in dense tables. */
  compact?: boolean;
}

/** Coloured dot + label, plus the model's confidence as a small bar. Colour is never the only cue. */
export function SentimentIndicator({ sentiment, compact = false }: Props) {
  const { t } = useI18n();
  const format = useFormat();
  if (!sentiment) {
    return (
      <span className="sentiment sentiment--none">
        <span className="sentiment__dot" aria-hidden="true" />
        <span className="sentiment__label">{t('sentiment.NONE')}</span>
      </span>
    );
  }
  const confidence = format.percent(sentiment.score);
  return (
    <span className={`sentiment sentiment--${sentiment.label.toLowerCase()}`}>
      <span className="sentiment__dot" aria-hidden="true" />
      <span className="sentiment__label">{t(`sentiment.${sentiment.label}`)}</span>
      {!compact && (
        <span className="sentiment__confidence" title={t('sentiment.confidence', { value: confidence })}>
          <span className="sentiment__bar" aria-hidden="true">
            <span className="sentiment__fill" style={{ width: `${Math.round(sentiment.score * 100)}%` }} />
          </span>
          <span className="sentiment__score">
            <span className="visually-hidden">{t('sentiment.confidenceLabel')} </span>
            {confidence}
          </span>
        </span>
      )}
    </span>
  );
}
