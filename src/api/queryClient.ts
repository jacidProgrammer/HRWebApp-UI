import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toApiError } from './errors';

const MAX_RETRIES = 2;

/**
 * Retry only what can succeed on a second try: network failures and 5xx. A 4xx (validation, forbidden,
 * not found, conflict) or an expired session will fail the same way again.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  const apiError = toApiError(error);
  if (apiError.status !== null && apiError.status < 500) return false;
  if (apiError.kind === 'UNKNOWN') return false;
  return failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache(),
    mutationCache: new MutationCache(),
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}
