import type { MessageKey } from '../i18n/core';

/**
 * Client-side checks mirroring the backend rules (contract v2), so most mistakes are caught before a
 * request: every employee field is required, salary > 0, emails must look like emails, feedback messages
 * are 1..500 characters, and text columns are VARCHAR(255). Errors are message keys, translated by the UI.
 */
export const MAX_TEXT_LENGTH = 255;
export const MESSAGE_MAX_LENGTH = 500;
/** The character counter appears once the message gets this close to the limit. */
export const MESSAGE_COUNTER_THRESHOLD = 400;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9._@-]+$/;

export type FieldErrors<K extends string> = Partial<Record<K, MessageKey>>;

export function hasErrors(errors: FieldErrors<string>): boolean {
  return Object.values(errors).some(Boolean);
}

function requiredText(value: string): MessageKey | undefined {
  if (!value.trim()) return 'validation.required';
  if (value.trim().length > MAX_TEXT_LENGTH) return 'validation.tooLong';
  return undefined;
}

function email(value: string): MessageKey | undefined {
  return requiredText(value) ?? (EMAIL_PATTERN.test(value.trim()) ? undefined : 'validation.email');
}

export interface EmployeeFormValues {
  username: string;
  name: string;
  department: string;
  role: string;
  email: string;
  salary: string;
  address: string;
}

export type EmployeeField = keyof EmployeeFormValues;

/** Accepts "61000", "61,000.50", "61.000,50" and "61000,5". */
export function parseSalary(value: string): number | null {
  let normalized = value.trim().replace(/[\s€]/g, '');
  if (!normalized) return null;
  const lastComma = normalized.lastIndexOf(',');
  const lastDot = normalized.lastIndexOf('.');
  if (lastComma > lastDot) normalized = normalized.replace(/\./g, '').replace(',', '.');
  else normalized = normalized.replace(/,/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateEmployee(values: EmployeeFormValues, { requireUsername }: { requireUsername: boolean }): FieldErrors<EmployeeField> {
  const salary = parseSalary(values.salary);
  return {
    username: !requireUsername
      ? undefined
      : (requiredText(values.username) ?? (USERNAME_PATTERN.test(values.username.trim()) ? undefined : 'validation.username')),
    name: requiredText(values.name),
    department: requiredText(values.department),
    role: requiredText(values.role),
    email: email(values.email),
    salary: !values.salary.trim()
      ? 'validation.required'
      : salary === null
        ? 'validation.number'
        : salary <= 0
          ? 'validation.salaryPositive'
          : undefined,
    address: requiredText(values.address),
  };
}

export interface ContactFormValues {
  email: string;
  address: string;
}

export function validateContactDetails(values: ContactFormValues): FieldErrors<keyof ContactFormValues> {
  return { email: email(values.email), address: requiredText(values.address) };
}

export interface RecognitionFormValues {
  recipientId: string | null;
  message: string;
}

export function validateRecognition(values: RecognitionFormValues): FieldErrors<keyof RecognitionFormValues> {
  const length = values.message.trim().length;
  return {
    recipientId: values.recipientId ? undefined : 'validation.recipient',
    message: length === 0 ? 'validation.messageRequired' : length > MESSAGE_MAX_LENGTH ? 'validation.messageTooLong' : undefined,
  };
}
