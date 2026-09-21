import axios from 'axios';
import type { ErrorResponseBody } from './types';

export type ApiErrorKind =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SERVER'
  | 'NETWORK'
  | 'UNKNOWN';

const TITLES: Record<ApiErrorKind, string> = {
  BAD_REQUEST: 'Invalid data',
  UNAUTHORIZED: 'Session expired',
  FORBIDDEN: 'Not allowed',
  NOT_FOUND: 'Not found',
  CONFLICT: 'Already exists',
  SERVER: 'Server error',
  NETWORK: 'Connection problem',
  UNKNOWN: 'Something went wrong',
};

const DEFAULT_MESSAGES: Record<ApiErrorKind, string> = {
  BAD_REQUEST: 'The request was not valid. Check the form and try again.',
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: "You don't have permission to perform this action.",
  NOT_FOUND: 'The requested record was not found. It may have been deleted.',
  CONFLICT: 'This conflicts with an existing record.',
  SERVER: 'The server ran into a problem. Please try again in a moment.',
  NETWORK: 'Cannot reach the HR service. Check that the backend is running and try again.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

/** Backend error codes (HttpStatus names) sent by GlobalExceptionHandler. */
const BACKEND_CODES = new Set(['BAD_REQUEST', 'FORBIDDEN', 'NOT_FOUND', 'CONFLICT']);

/** An API failure translated into something the UI can show to the user. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** HTTP status, or null when no response was received. */
  readonly status: number | null;
  /** The backend's error code (e.g. "CONFLICT") when the response carried an ErrorResponse body. */
  readonly code: string | null;
  readonly title: string;

  constructor(kind: ApiErrorKind, message: string, status: number | null = null, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.title = TITLES[kind];
  }
}

export function kindForStatus(status: number): ApiErrorKind {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    default:
      return status >= 500 ? 'SERVER' : 'UNKNOWN';
  }
}

function isErrorResponseBody(data: unknown): data is ErrorResponseBody {
  if (typeof data !== 'object' || data === null) return false;
  const { code, message } = data as Record<string, unknown>;
  return typeof code === 'string' && BACKEND_CODES.has(code) && typeof message === 'string' && message.trim() !== '';
}

export function unauthorizedError(): ApiError {
  return new ApiError('UNAUTHORIZED', DEFAULT_MESSAGES.UNAUTHORIZED, 401);
}

/**
 * Maps anything thrown by the HTTP client to an {@link ApiError}. Business errors keep the backend's
 * message (it names the field or employee involved); security and infrastructure errors, whose bodies
 * are empty or technical, get a generic user-facing message.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isAxiosError(error)) {
    const response = error.response;
    if (!response) {
      return new ApiError('NETWORK', DEFAULT_MESSAGES.NETWORK);
    }
    const kind = kindForStatus(response.status);
    const body: unknown = response.data;
    if (kind !== 'UNAUTHORIZED' && kind !== 'SERVER' && isErrorResponseBody(body)) {
      return new ApiError(kind, body.message, response.status, body.code);
    }
    return new ApiError(kind, DEFAULT_MESSAGES[kind], response.status);
  }

  return new ApiError('UNKNOWN', DEFAULT_MESSAGES.UNKNOWN);
}
