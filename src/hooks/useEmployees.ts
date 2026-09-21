import { employeesApi } from '../api/employees';
import { useAsync } from './useAsync';

/** The employee list as the signed-in user is allowed to see it. */
export function useEmployees() {
  return useAsync(employeesApi.list);
}
