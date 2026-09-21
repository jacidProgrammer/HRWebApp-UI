/** Mirrors EmployeeDTO. `salary` and `address` are null when the caller is not allowed to see them. */
export interface Employee {
  name: string;
  department: string;
  role: string;
  email: string;
  salary: number | null;
  address: string | null;
}

/** Body of POST /employees and of a manager's PUT /employees/{name}: every field is required. */
export interface EmployeeInput {
  name: string;
  department: string;
  role: string;
  email: string;
  salary: number;
  address: string;
}

/** Body of an employee's PUT on their own profile: only the contact details may change. */
export interface ContactDetailsInput {
  email: string;
  address: string;
}

/** Mirrors FeedbackDTO. `name` is the employee the feedback is about; `label`/`score` are null when not analysed. */
export interface Feedback {
  name: string;
  message: string;
  score: number | null;
  label: string | null;
}

export interface FeedbackInput {
  name: string;
  message: string;
}

/** Mirrors ErrorResponse from the backend's GlobalExceptionHandler. */
export interface ErrorResponseBody {
  code: string;
  message: string;
}
