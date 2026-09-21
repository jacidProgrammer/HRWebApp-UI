import { http } from './http';
import type {
  ContactDetailsInput,
  Employee,
  EmployeeCreateInput,
  EmployeeUpdateInput,
  Feedback,
  FeedbackInput,
  FeedbackQuery,
  Settings,
  StatsOverview,
} from './types';

const employeePath = (id: string) => `/employees/${encodeURIComponent(id)}`;

export const employeesApi = {
  /** MANAGER and EMPLOYEE. salary/address are null except for managers and the caller's own record. */
  list: async (): Promise<Employee[]> => (await http.get<Employee[]>('/employees')).data,
  /** The employee linked to the signed-in user; 404 if there is none (e.g. the demo manager). */
  me: async (): Promise<Employee> => (await http.get<Employee>('/employees/me')).data,
  get: async (id: string): Promise<Employee> => (await http.get<Employee>(employeePath(id))).data,
  /** MANAGER. 409 if the username is taken. */
  create: async (input: EmployeeCreateInput): Promise<Employee> =>
    (await http.post<Employee>('/employees', input)).data,
  /** MANAGER: every field except the username. */
  update: async (id: string, input: EmployeeUpdateInput): Promise<Employee> =>
    (await http.put<Employee>(employeePath(id), input)).data,
  /** EMPLOYEE on their own record: only email and address. */
  updateContactDetails: async (id: string, input: ContactDetailsInput): Promise<Employee> =>
    (await http.put<Employee>(employeePath(id), input)).data,
  /** MANAGER. */
  remove: async (id: string): Promise<void> => {
    await http.delete(employeePath(id));
  },
};

export const feedbackApi = {
  /** EMPLOYEE: feedback about the caller, newest first. */
  received: async (): Promise<Feedback[]> => (await http.get<Feedback[]>('/feedback/received')).data,
  /** EMPLOYEE: feedback written by the caller, newest first. */
  sent: async (): Promise<Feedback[]> => (await http.get<Feedback[]>('/feedback/sent')).data,
  /** MANAGER: all feedback with optional filters, newest first. */
  list: async (query: FeedbackQuery = {}): Promise<Feedback[]> => {
    const params = Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== ''));
    return (await http.get<Feedback[]>('/feedback', { params })).data;
  },
  /** EMPLOYEE with an employee record. */
  send: async (input: FeedbackInput): Promise<Feedback> => (await http.post<Feedback>('/feedback', input)).data,
};

export const statsApi = {
  /** MANAGER. `months` is 1..12 (default 6 on the server). */
  overview: async (months?: number): Promise<StatsOverview> =>
    (await http.get<StatsOverview>('/stats/overview', { params: months ? { months } : undefined })).data,
};

export const settingsApi = {
  get: async (): Promise<Settings> => (await http.get<Settings>('/settings')).data,
  /** MANAGER. */
  update: async (sentimentAnalysisEnabled: boolean): Promise<Settings> =>
    (await http.put<Settings>('/settings', { sentimentAnalysisEnabled })).data,
};
