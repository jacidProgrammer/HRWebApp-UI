import type { ApiError } from '../../api/errors';

/**
 * The person in the URL doesn't exist: deleted (404), or the link is broken and the id isn't even a UUID,
 * which the API rejects with a 400 before looking anything up.
 */
export const isMissingPerson = (error: ApiError) => error.kind === 'NOT_FOUND' || error.kind === 'BAD_REQUEST';
