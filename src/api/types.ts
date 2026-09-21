/** Types mirroring HR API contract v2. Dates are ISO-8601 UTC strings, ids are UUIDs. */

export interface Employee {
  id: string;
  /** Keycloak username; unique and immutable. Matched case-insensitively against `preferred_username`. */
  username: string;
  /** Display name only: it can change and need not be unique. */
  name: string;
  department: string;
  role: string;
  email: string;
  /** Null unless the caller is a MANAGER or the employee themself. */
  salary: number | null;
  /** Null unless the caller is a MANAGER or the employee themself. */
  address: string | null;
  createdAt: string;
}

/** Body of POST /employees (MANAGER): every field is required. */
export interface EmployeeCreateInput {
  username: string;
  name: string;
  department: string;
  role: string;
  email: string;
  salary: number;
  address: string;
}

/** Body of a manager's PUT /employees/{id}: every field except the immutable username. */
export type EmployeeUpdateInput = Omit<EmployeeCreateInput, 'username'>;

/** Body of an employee's PUT on their own record: only the contact details may change. */
export interface ContactDetailsInput {
  email: string;
  address: string;
}

export const COMPANY_VALUES = ['TEAMWORK', 'OWNERSHIP', 'CRAFT', 'CUSTOMER_FOCUS', 'GROWTH'] as const;
export type CompanyValue = (typeof COMPANY_VALUES)[number];

export const SENTIMENT_LABELS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'] as const;
export type SentimentLabel = (typeof SENTIMENT_LABELS)[number];

export interface Sentiment {
  label: SentimentLabel;
  /** Model confidence, 0..1. */
  score: number;
}

export interface Feedback {
  id: string;
  recipientId: string;
  recipientName: string;
  /** Null when the feedback is anonymous (except in the author's own "sent" list) or the author was deleted. */
  authorId: string | null;
  authorName: string | null;
  anonymous: boolean;
  value: CompanyValue | null;
  message: string;
  /** Null when analysis is disabled, failed, or not configured. */
  sentiment: Sentiment | null;
  createdAt: string;
}

export interface FeedbackInput {
  recipientId: string;
  message: string;
  value?: CompanyValue | null;
  anonymous: boolean;
}

/** Sentiment filter of GET /feedback; NONE means "not analysed". */
export type SentimentFilter = SentimentLabel | 'NONE';

export interface FeedbackQuery {
  recipientId?: string;
  department?: string;
  /** Inclusive, ISO date (YYYY-MM-DD). */
  from?: string;
  /** Inclusive, ISO date (YYYY-MM-DD). */
  to?: string;
  sentiment?: SentimentFilter;
}

export interface StatsOverview {
  headcount: number;
  departments: { name: string; headcount: number }[];
  feedback: { thisMonth: number; lastMonth: number; total: number };
  sentimentShare: { positive: number; neutral: number; negative: number; notAnalysed: number };
  trend: TrendPoint[];
  valueCounts: { value: CompanyValue; count: number }[];
  topRecognised: { employeeId: string; name: string; department: string; count: number; positiveShare: number }[];
  alerts: SentimentAlert[];
}

export interface TrendPoint {
  /** Calendar month (UTC), `YYYY-MM`. */
  month: string;
  positive: number;
  neutral: number;
  negative: number;
  notAnalysed: number;
}

export interface SentimentAlert {
  employeeId: string;
  name: string;
  department: string;
  previousPositiveShare: number;
  currentPositiveShare: number;
  feedbackCount: number;
}

export interface Settings {
  sentimentAnalysisEnabled: boolean;
  /** Whether a model token is configured on the server. */
  sentimentAnalysisAvailable: boolean;
}

/** Error body sent by the backend's GlobalExceptionHandler. */
export interface ErrorResponseBody {
  code: string;
  message: string;
}
