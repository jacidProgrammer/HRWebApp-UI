import { describe, expect, it } from 'vitest';
import { ApiError, type ApiErrorKind } from './errors';
import { shouldRetry } from './queryClient';

const apiError = (kind: ApiErrorKind, status: number | null) => new ApiError(kind, kind, status);

describe('shouldRetry', () => {
  it.each([
    ['BAD_REQUEST', 400],
    ['UNAUTHORIZED', 401],
    ['FORBIDDEN', 403],
    ['NOT_FOUND', 404],
    ['CONFLICT', 409],
  ] as const)('never retries a %s (%i)', (kind, status) => {
    expect(shouldRetry(0, apiError(kind, status))).toBe(false);
  });

  it('retries server and network failures at most twice', () => {
    expect(shouldRetry(0, apiError('SERVER', 503))).toBe(true);
    expect(shouldRetry(1, apiError('NETWORK', null))).toBe(true);
    expect(shouldRetry(2, apiError('SERVER', 500))).toBe(false);
  });

  it('does not retry unexpected client-side errors', () => {
    expect(shouldRetry(0, new TypeError('boom'))).toBe(false);
  });
});
