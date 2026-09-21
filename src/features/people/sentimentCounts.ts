import type { Feedback } from '../../api/types';

export interface SentimentCounts {
  positive: number;
  neutral: number;
  negative: number;
  notAnalysed: number;
  total: number;
  /** Positive share among analysed feedback, or null if nothing was analysed. */
  positiveShare: number | null;
}

export function countSentiment(items: Feedback[]): SentimentCounts {
  const counts = { positive: 0, neutral: 0, negative: 0, notAnalysed: 0 };
  for (const item of items) {
    if (!item.sentiment) counts.notAnalysed += 1;
    else if (item.sentiment.label === 'POSITIVE') counts.positive += 1;
    else if (item.sentiment.label === 'NEUTRAL') counts.neutral += 1;
    else counts.negative += 1;
  }
  const analysed = items.length - counts.notAnalysed;
  return { ...counts, total: items.length, positiveShare: analysed ? counts.positive / analysed : null };
}
