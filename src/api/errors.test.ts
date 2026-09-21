import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import { ApiError, toApiError } from './errors';

function httpError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response = { status, statusText: '', data, headers: {}, config } as AxiosResponse;
  return new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_RESPONSE', config, {}, response);
}

describe('toApiError', () => {
  it.each([
    [400, 'BAD_REQUEST', 'Missing required fields: email, salary'],
    [403, 'FORBIDDEN', 'Only managers can change department, role or salary'],
    [404, 'NOT_FOUND', "Employee 'Ghost' not found"],
    [409, 'CONFLICT', "Employee 'Jose' already exists"],
  ] as const)('keeps the backend message of a %i %s ErrorResponse', (status, code, message) => {
    const error = toApiError(httpError(status, { code, message }));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(status);
    expect(error.kind).toBe(code);
    expect(error.code).toBe(code);
    expect(error.message).toBe(message);
  });

  it('uses a friendly message for a 403 from Spring Security, which has no body', () => {
    const error = toApiError(httpError(403, ''));

    expect(error.kind).toBe('FORBIDDEN');
    expect(error.code).toBeNull();
    expect(error.message).toBe("You don't have permission to perform this action.");
    expect(error.title).toBe('Not allowed');
  });

  it('treats 401 as an expired session regardless of the body', () => {
    const error = toApiError(httpError(401, { code: 'BAD_REQUEST', message: 'ignored' }));

    expect(error.kind).toBe('UNAUTHORIZED');
    expect(error.message).toMatch(/session has expired/i);
  });

  it('does not leak technical details of server errors', () => {
    const error = toApiError(httpError(500, { timestamp: '2026-01-01', status: 500, error: 'Internal Server Error', path: '/feedback' }));

    expect(error.kind).toBe('SERVER');
    expect(error.message).toBe('The server ran into a problem. Please try again in a moment.');
  });

  it('ignores bodies that are not an ErrorResponse, such as Spring default errors for malformed JSON', () => {
    const error = toApiError(httpError(400, { status: 400, error: 'Bad Request', path: '/employees' }));

    expect(error.kind).toBe('BAD_REQUEST');
    expect(error.message).toBe('The request was not valid. Check the form and try again.');
  });

  it('reports a network error when there is no response (backend down or CORS rejected)', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'));

    expect(error.kind).toBe('NETWORK');
    expect(error.status).toBeNull();
    expect(error.message).toMatch(/cannot reach the hr service/i);
  });

  it('returns ApiError instances unchanged and wraps anything else', () => {
    const original = new ApiError('CONFLICT', 'taken', 409);

    expect(toApiError(original)).toBe(original);
    expect(toApiError(new Error('boom')).kind).toBe('UNKNOWN');
  });
});
