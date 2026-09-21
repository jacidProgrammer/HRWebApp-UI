import { http } from './http';
import type { Feedback, FeedbackInput } from './types';

/** Every feedback endpoint requires the EMPLOYEE role. */
export const feedbackApi = {
  list: async (): Promise<Feedback[]> => {
    const { data } = await http.get<Feedback[]>('/feedback');
    return data;
  },

  /** Feedback about one employee (the name must match exactly). */
  listAbout: async (name: string): Promise<Feedback[]> => {
    const { data } = await http.get<Feedback[]>(`/feedback/${encodeURIComponent(name)}`);
    return data;
  },

  /** The author is the employee matching the signed-in user; 403 if there is none. */
  send: async (input: FeedbackInput): Promise<Feedback> => {
    const { data } = await http.post<Feedback>('/feedback', input);
    return data;
  },
};
