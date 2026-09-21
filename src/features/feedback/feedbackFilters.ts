import type { FeedbackQuery, SentimentFilter } from '../../api/types';

const SENTIMENTS: SentimentFilter[] = ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'NONE'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Reads the explorer filters from the URL (`?dept=&person=&sentiment=&from=&to=`), dropping invalid values. */
export function readFeedbackFilters(params: URLSearchParams): FeedbackQuery {
  const sentiment = params.get('sentiment') as SentimentFilter | null;
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const query: FeedbackQuery = {};
  if (params.get('dept')) query.department = params.get('dept') ?? undefined;
  if (params.get('person')) query.recipientId = params.get('person') ?? undefined;
  if (sentiment && SENTIMENTS.includes(sentiment)) query.sentiment = sentiment;
  if (ISO_DATE.test(from)) query.from = from;
  if (ISO_DATE.test(to)) query.to = to;
  return query;
}

export function writeFeedbackFilters(query: FeedbackQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.department) params.set('dept', query.department);
  if (query.recipientId) params.set('person', query.recipientId);
  if (query.sentiment) params.set('sentiment', query.sentiment);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  return params;
}

export const activeFilterCount = (query: FeedbackQuery) => Object.values(query).filter(Boolean).length;
