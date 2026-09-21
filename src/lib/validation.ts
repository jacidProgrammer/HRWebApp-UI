/**
 * Client-side checks mirroring the backend rules, so most mistakes are caught before a request:
 * every employee field is mandatory (Employee.requireComplete), feedback needs a colleague and a message
 * (FeedbackServiceImpl), and text columns are VARCHAR(255) in the database.
 */
export const MAX_TEXT_LENGTH = 255;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export function hasErrors(errors: FieldErrors<string>): boolean {
  return Object.values(errors).some(Boolean);
}

function requiredText(value: string, label: string): string | undefined {
  if (!value.trim()) return `${label} is required.`;
  if (value.trim().length > MAX_TEXT_LENGTH) return `${label} must be at most ${MAX_TEXT_LENGTH} characters.`;
  return undefined;
}

function email(value: string): string | undefined {
  return requiredText(value, 'Email') ?? (EMAIL_PATTERN.test(value.trim()) ? undefined : 'Enter a valid email address.');
}

export interface EmployeeFormValues {
  name: string;
  department: string;
  role: string;
  email: string;
  salary: string;
  address: string;
}

export type EmployeeField = keyof EmployeeFormValues;

export function parseSalary(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateEmployee(values: EmployeeFormValues): FieldErrors<EmployeeField> {
  const salary = parseSalary(values.salary);
  return {
    name: requiredText(values.name, 'Name'),
    department: requiredText(values.department, 'Department'),
    role: requiredText(values.role, 'Role'),
    email: email(values.email),
    salary: !values.salary.trim()
      ? 'Salary is required.'
      : salary === null
        ? 'Salary must be a number.'
        : salary < 0
          ? 'Salary cannot be negative.'
          : undefined,
    address: requiredText(values.address, 'Address'),
  };
}

export interface ContactFormValues {
  email: string;
  address: string;
}

export function validateContactDetails(values: ContactFormValues): FieldErrors<keyof ContactFormValues> {
  return {
    email: email(values.email),
    address: requiredText(values.address, 'Address'),
  };
}

export interface FeedbackFormValues {
  name: string;
  message: string;
}

export function validateFeedback(values: FeedbackFormValues): FieldErrors<keyof FeedbackFormValues> {
  return {
    name: values.name.trim() ? undefined : 'Choose a colleague.',
    message: requiredText(values.message, 'Message'),
  };
}
