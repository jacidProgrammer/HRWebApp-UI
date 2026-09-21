import { formatScore } from '../lib/format';

interface SentimentBadgeProps {
  label: string | null;
  score: number | null;
}

const TONES: Record<string, string> = {
  positive: 'positive',
  neutral: 'neutral',
  negative: 'negative',
};

/** Sentiment computed by the backend's Hugging Face model; null when the analysis was unavailable. */
export function SentimentBadge({ label, score }: SentimentBadgeProps) {
  if (!label) {
    return (
      <span className="badge badge--muted" title="The sentiment service was unavailable when this was sent">
        Not analysed
      </span>
    );
  }
  const normalized = label.toLowerCase();
  const tone = TONES[normalized] ?? 'neutral';
  const text = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return (
    <span className={`badge badge--${tone}`}>
      {text}
      {score !== null && (
        <span className="badge__score">
          <span className="visually-hidden">, confidence </span>
          {formatScore(score)}
        </span>
      )}
    </span>
  );
}
