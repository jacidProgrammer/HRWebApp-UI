import { http } from './http';
import type { ContactDetailsInput, Employee, EmployeeInput } from './types';

const employeePath = (name: string) => `/employees/${encodeURIComponent(name)}`;

export const employeesApi = {
  /** MANAGER and EMPLOYEE. Employees only receive salary/address on their own record. */
  list: async (): Promise<Employee[]> => {
    const { data } = await http.get<Employee[]>('/employees');
    return data;
  },

  /** MANAGER only. */
  get: async (name: string): Promise<Employee> => {
    const { data } = await http.get<Employee>(employeePath(name));
    return data;
  },

  /** MANAGER only. 409 if the name is taken, 400 if a field is missing. */
  create: async (input: EmployeeInput): Promise<Employee> => {
    const { data } = await http.post<Employee>('/employees', input);
    return data;
  },

  /** MANAGER: replaces every field except the name. */
  update: async (name: string, input: EmployeeInput): Promise<Employee> => {
    const { data } = await http.put<Employee>(employeePath(name), input);
    return data;
  },

  /** EMPLOYEE on their own profile: only email and address may change. */
  updateContactDetails: async (name: string, input: ContactDetailsInput): Promise<Employee> => {
    const { data } = await http.put<Employee>(employeePath(name), input);
    return data;
  },

  /** MANAGER only. */
  remove: async (name: string): Promise<void> => {
    await http.delete(employeePath(name));
  },
};
