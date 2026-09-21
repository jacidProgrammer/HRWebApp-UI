import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { employeesApi, feedbackApi, settingsApi, statsApi } from './endpoints';
import type { ApiError } from './errors';
import { queryKeys } from './queryKeys';
import type {
  ContactDetailsInput,
  Employee,
  EmployeeCreateInput,
  EmployeeUpdateInput,
  Feedback,
  FeedbackInput,
  FeedbackQuery,
  Settings,
} from './types';

/* Queries ------------------------------------------------------------------------------------------ */

export function useEmployees() {
  return useQuery<Employee[], ApiError>({ queryKey: queryKeys.employees.list(), queryFn: employeesApi.list });
}

export function useEmployee(id: string | undefined) {
  return useQuery<Employee, ApiError>({
    queryKey: queryKeys.employees.detail(id ?? ''),
    queryFn: () => employeesApi.get(id ?? ''),
    enabled: !!id,
  });
}

/** The caller's own employee record. `enabled` is false for users without the EMPLOYEE role. */
export function useMyEmployee(enabled = true) {
  return useQuery<Employee, ApiError>({ queryKey: queryKeys.employees.me(), queryFn: employeesApi.me, enabled });
}

export function useReceivedFeedback() {
  return useQuery<Feedback[], ApiError>({ queryKey: queryKeys.feedback.received(), queryFn: feedbackApi.received });
}

export function useSentFeedback() {
  return useQuery<Feedback[], ApiError>({ queryKey: queryKeys.feedback.sent(), queryFn: feedbackApi.sent });
}

export function useFeedbackList(query: FeedbackQuery, enabled = true) {
  return useQuery<Feedback[], ApiError>({
    queryKey: queryKeys.feedback.list(query),
    queryFn: () => feedbackApi.list(query),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useStatsOverview(months = 6) {
  return useQuery({ queryKey: queryKeys.stats.overview(months), queryFn: () => statsApi.overview(months) });
}

export function useSettings() {
  return useQuery<Settings, ApiError>({ queryKey: queryKeys.settings, queryFn: settingsApi.get, staleTime: 60_000 });
}

/* Mutations ---------------------------------------------------------------------------------------- */

function useInvalidate() {
  const queryClient = useQueryClient();
  return (...keys: QueryKey[]) => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

export function useCreateEmployee() {
  const invalidate = useInvalidate();
  const queryClient = useQueryClient();
  return useMutation<Employee, ApiError, EmployeeCreateInput>({
    mutationFn: employeesApi.create,
    onSuccess: async (created) => {
      queryClient.setQueryData(queryKeys.employees.detail(created.id), created);
      await invalidate(queryKeys.employees.list(), queryKeys.stats.all);
    },
  });
}

export function useUpdateEmployee(id: string) {
  const invalidate = useInvalidate();
  const queryClient = useQueryClient();
  return useMutation<Employee, ApiError, EmployeeUpdateInput>({
    mutationFn: (input) => employeesApi.update(id, input),
    onSuccess: async (updated) => {
      queryClient.setQueryData(queryKeys.employees.detail(id), updated);
      // Names and departments appear in feedback and stats too.
      await invalidate(queryKeys.employees.list(), queryKeys.feedback.all, queryKeys.stats.all);
    },
  });
}

export function useUpdateContactDetails(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Employee, ApiError, ContactDetailsInput>({
    mutationFn: (input) => employeesApi.updateContactDetails(id, input),
    onSuccess: async (updated) => {
      queryClient.setQueryData(queryKeys.employees.me(), updated);
      queryClient.setQueryData(queryKeys.employees.detail(id), updated);
      await queryClient.invalidateQueries({ queryKey: queryKeys.employees.list() });
    },
  });
}

/** Removes the person from the cached list right away and restores it if the request fails. */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation<void, ApiError, Employee, { previous: Employee[] | undefined }>({
    mutationFn: (employee) => employeesApi.remove(employee.id),
    onMutate: async (employee) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.employees.list() });
      const previous = queryClient.getQueryData<Employee[]>(queryKeys.employees.list());
      queryClient.setQueryData<Employee[]>(queryKeys.employees.list(), (list) =>
        list?.filter((item) => item.id !== employee.id),
      );
      return { previous };
    },
    onError: (_error, _employee, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.employees.list(), context.previous);
    },
    onSuccess: (_data, employee) => {
      queryClient.removeQueries({ queryKey: queryKeys.employees.detail(employee.id) });
    },
    onSettled: () => invalidate(queryKeys.employees.list(), queryKeys.feedback.all, queryKeys.stats.all),
  });
}

export function useSendFeedback() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation<Feedback, ApiError, FeedbackInput>({
    mutationFn: feedbackApi.send,
    onSuccess: async (created) => {
      queryClient.setQueryData<Feedback[]>(queryKeys.feedback.sent(), (list) => (list ? [created, ...list] : list));
      await invalidate(queryKeys.feedback.all, queryKeys.stats.all);
    },
  });
}

/** Flips the toggle immediately and rolls back if the server refuses. */
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation<Settings, ApiError, boolean, { previous: Settings | undefined }>({
    mutationFn: settingsApi.update,
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.settings });
      const previous = queryClient.getQueryData<Settings>(queryKeys.settings);
      if (previous) queryClient.setQueryData<Settings>(queryKeys.settings, { ...previous, sentimentAnalysisEnabled: enabled });
      return { previous };
    },
    onError: (_error, _enabled, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.settings, context.previous);
    },
    onSuccess: (settings) => queryClient.setQueryData(queryKeys.settings, settings),
  });
}
