import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestQueryClient } from '../test/render';
import { restoreApi, useMockApi } from '../test/mockApi';
import {
  useDeleteEmployee,
  useEmployee,
  useEmployees,
  useMyEmployee,
  useSendFeedback,
  useSentFeedback,
  useSettings,
  useUpdateSettings,
} from './hooks';
import { queryKeys } from './queryKeys';
import type { Employee, Settings } from './types';

function setup<T>(hook: () => T, queryClient: QueryClient = createTestQueryClient()) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { ...renderHook(hook, { wrapper }), queryClient };
}

afterEach(restoreApi);

describe('query hooks', () => {
  it('loads the employee list', async () => {
    useMockApi('manager');
    const { result } = setup(() => useEmployees());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(12);
    expect(result.current.data?.every((e) => typeof e.salary === 'number')).toBe(true);
  });

  it('loads the caller’s own record from /employees/me', async () => {
    useMockApi('jose');
    const { result } = setup(() => useMyEmployee());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.username).toBe('jose');
    expect(result.current.data?.salary).not.toBeNull();
  });

  it('maps API failures to ApiError', async () => {
    useMockApi('manager');
    const { result } = setup(() => useEmployee('00000000-0000-4000-8000-000000000000'));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ name: 'ApiError', kind: 'NOT_FOUND', status: 404 });
  });

  it('does not fetch a person without an id', () => {
    useMockApi('manager');
    const { result } = setup(() => useEmployee(undefined));
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('mutation hooks', () => {
  it('removes a deleted person from the cached list', async () => {
    useMockApi('manager');
    const { result, queryClient } = setup(() => ({ list: useEmployees(), remove: useDeleteEmployee() }));
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    const victim = result.current.list.data?.[0] as Employee;

    act(() => result.current.remove.mutate(victim));

    await waitFor(() =>
      expect(queryClient.getQueryData<Employee[]>(queryKeys.employees.list())?.some((e) => e.id === victim.id)).toBe(false),
    );
    await waitFor(() => expect(result.current.remove.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.list.data).toHaveLength(11));
  });

  it('restores the list when the delete fails', async () => {
    const api = useMockApi('manager');
    const { result } = setup(() => ({ list: useEmployees(), remove: useDeleteEmployee() }));
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    const victim = result.current.list.data?.[0] as Employee;
    api.fail('delete', '/employees/:id', 500, { code: 'INTERNAL_SERVER_ERROR', message: 'Database down' }, 150);

    act(() => result.current.remove.mutate(victim));

    await waitFor(() => expect(result.current.remove.isError).toBe(true));
    expect(result.current.remove.error).toMatchObject({ kind: 'SERVER', status: 500 });
    await waitFor(() => expect(result.current.list.data?.some((e) => e.id === victim.id)).toBe(true));
  });

  it('adds sent recognition to the Sent list and marks stats stale', async () => {
    const api = useMockApi('jose');
    const { result, queryClient } = setup(() => ({ sent: useSentFeedback(), send: useSendFeedback() }));
    await waitFor(() => expect(result.current.sent.isSuccess).toBe(true));
    const before = result.current.sent.data?.length ?? 0;
    queryClient.setQueryData(queryKeys.stats.overview(6), { stale: false });
    const louisa = api.db.data.employees.find((e) => e.username === 'louisa');

    await act(() =>
      result.current.send.mutateAsync({
        recipientId: louisa?.id ?? '',
        value: 'TEAMWORK',
        message: 'Thanks for pairing on the release checklist!',
        anonymous: true,
      }),
    );

    await waitFor(() => expect(result.current.sent.data).toHaveLength(before + 1));
    expect(result.current.sent.data?.[0]).toMatchObject({ recipientName: louisa?.name, anonymous: true, value: 'TEAMWORK' });
    expect(queryClient.getQueryState(queryKeys.stats.overview(6))?.isInvalidated).toBe(true);
  });

  it('flips the AI setting optimistically and rolls back when refused', async () => {
    const api = useMockApi('manager');
    const { result, queryClient } = setup(() => ({ settings: useSettings(), update: useUpdateSettings() }));
    await waitFor(() => expect(result.current.settings.isSuccess).toBe(true));
    const initial = result.current.settings.data?.sentimentAnalysisEnabled;
    api.fail('put', '/settings', 403, undefined, 150);

    act(() => result.current.update.mutate(!initial));

    await waitFor(() =>
      expect(queryClient.getQueryData<Settings>(queryKeys.settings)?.sentimentAnalysisEnabled).toBe(!initial),
    );
    await waitFor(() => expect(result.current.update.isError).toBe(true));
    expect(result.current.update.error).toMatchObject({ kind: 'FORBIDDEN' });
    expect(queryClient.getQueryData<Settings>(queryKeys.settings)?.sentimentAnalysisEnabled).toBe(initial);
  });
});
