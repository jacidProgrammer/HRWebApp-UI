import type { FeedbackQuery } from './types';

/**
 * Query keys per resource. Mutations invalidate by prefix (e.g. `queryKeys.feedback.all`), so every list
 * of a resource refreshes without knowing which filters are cached.
 */
export const queryKeys = {
  employees: {
    all: ['employees'] as const,
    list: () => ['employees', 'list'] as const,
    me: () => ['employees', 'me'] as const,
    detail: (id: string) => ['employees', 'detail', id] as const,
  },
  feedback: {
    all: ['feedback'] as const,
    received: () => ['feedback', 'received'] as const,
    sent: () => ['feedback', 'sent'] as const,
    list: (query: FeedbackQuery) => ['feedback', 'list', query] as const,
  },
  stats: {
    all: ['stats'] as const,
    overview: (months: number) => ['stats', 'overview', months] as const,
  },
  settings: ['settings'] as const,
};
