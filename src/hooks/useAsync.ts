import { useCallback, useEffect, useState } from 'react';
import { toApiError, type ApiError } from '../api/errors';

export type AsyncState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: ApiError };

interface Settled<T> {
  load: () => Promise<T>;
  attempt: number;
  state: AsyncState<T>;
}

export type AsyncResult<T> = AsyncState<T> & {
  reload: () => void;
  /** Updates the loaded data locally, e.g. after a successful create or delete. */
  setData: (update: (current: T) => T) => void;
};

/**
 * Runs `load` (which must be memoised with useCallback) and tracks its loading/success/error state.
 * A new `load` function or a call to `reload` starts a fresh request; late responses are ignored.
 */
export function useAsync<T>(load: () => Promise<T>): AsyncResult<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    let active = true;
    load().then(
      (data) => {
        if (active) setSettled({ load, attempt, state: { status: 'success', data } });
      },
      (error: unknown) => {
        if (active) setSettled({ load, attempt, state: { status: 'error', error: toApiError(error) } });
      },
    );
    return () => {
      active = false;
    };
  }, [load, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  const setData = useCallback((update: (current: T) => T) => {
    setSettled((previous) =>
      previous?.state.status === 'success'
        ? { ...previous, state: { status: 'success', data: update(previous.state.data) } }
        : previous,
    );
  }, []);

  const current = settled && settled.load === load && settled.attempt === attempt ? settled.state : null;
  return { ...(current ?? { status: 'loading' }), reload, setData };
}
