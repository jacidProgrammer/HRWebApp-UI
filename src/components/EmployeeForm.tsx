import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toApiError, type ApiError } from '../api/errors';
import type { Employee, EmployeeInput } from '../api/types';
import {
  hasErrors,
  MAX_TEXT_LENGTH,
  parseSalary,
  validateEmployee,
  type EmployeeField,
  type EmployeeFormValues,
  type FieldErrors,
} from '../lib/validation';
import { TextField } from './FormField';
import { ErrorAlert } from './StatusViews';

interface EmployeeFormProps {
  mode: 'create' | 'edit';
  initial?: Employee;
  /** Existing departments, offered as suggestions. */
  departments?: readonly string[];
  onSubmit: (input: EmployeeInput) => Promise<void>;
  cancelTo: string;
}

const EMPTY: EmployeeFormValues = { name: '', department: '', role: '', email: '', salary: '', address: '' };

function toFormValues(employee: Employee | undefined): EmployeeFormValues {
  if (!employee) return EMPTY;
  return {
    name: employee.name,
    department: employee.department,
    role: employee.role,
    email: employee.email,
    salary: employee.salary === null ? '' : String(employee.salary),
    address: employee.address ?? '',
  };
}

const FIELD_NAMES: readonly EmployeeField[] = ['name', 'department', 'role', 'email', 'salary', 'address'];

/** Turns backend validation errors into field errors where the message says which field is wrong. */
function fieldErrorsFromServer(error: ApiError): FieldErrors<EmployeeField> {
  if (error.kind === 'CONFLICT') {
    return { name: error.message };
  }
  const missing = /Missing required fields: (.+)$/.exec(error.message);
  if (error.kind === 'BAD_REQUEST' && missing?.[1]) {
    const errors: FieldErrors<EmployeeField> = {};
    for (const field of missing[1].split(',').map((part) => part.trim())) {
      if ((FIELD_NAMES as readonly string[]).includes(field)) {
        errors[field as EmployeeField] = 'This field is required.';
      }
    }
    return errors;
  }
  return {};
}

/** Create or fully edit an employee (manager only). The name identifies the employee and cannot change. */
export function EmployeeForm({ mode, initial, departments = [], onSubmit, cancelTo }: EmployeeFormProps) {
  const [values, setValues] = useState<EmployeeFormValues>(() => toFormValues(initial));
  const [errors, setErrors] = useState<FieldErrors<EmployeeField>>({});
  const [serverError, setServerError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const departmentListId = useId();

  const update = (field: EmployeeField) => (event: { target: { value: string } }) => {
    const value = event.target.value;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateEmployee(values);
    setErrors(validation);
    setServerError(null);
    if (hasErrors(validation)) {
      const firstInvalid = FIELD_NAMES.find((field) => validation[field]);
      const control = firstInvalid ? event.currentTarget.elements.namedItem(firstInvalid) : null;
      if (control instanceof HTMLElement) control.focus();
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        department: values.department.trim(),
        role: values.role.trim(),
        email: values.email.trim(),
        salary: parseSalary(values.salary) ?? 0,
        address: values.address.trim(),
      });
    } catch (error) {
      const apiError = toApiError(error);
      setServerError(apiError);
      setErrors(fieldErrorsFromServer(apiError));
      setSubmitting(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
      {serverError && <ErrorAlert error={serverError} title={`Could not save: ${serverError.title.toLowerCase()}`} />}

      <div className="form__grid">
        <TextField
          label="Name"
          name="name"
          value={values.name}
          onChange={update('name')}
          error={errors.name}
          required
          maxLength={MAX_TEXT_LENGTH}
          autoComplete="off"
          readOnly={mode === 'edit'}
          hint={mode === 'edit' ? 'The name identifies the employee and cannot be changed.' : 'Must match the Keycloak username for the employee to sign in.'}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={update('email')}
          error={errors.email}
          required
          maxLength={MAX_TEXT_LENGTH}
          autoComplete="off"
        />
        <TextField
          label="Department"
          name="department"
          value={values.department}
          onChange={update('department')}
          error={errors.department}
          required
          maxLength={MAX_TEXT_LENGTH}
          list={departments.length ? departmentListId : undefined}
          autoComplete="off"
        />
        <TextField
          label="Role"
          name="role"
          value={values.role}
          onChange={update('role')}
          error={errors.role}
          required
          maxLength={MAX_TEXT_LENGTH}
          autoComplete="off"
          hint="Job title, e.g. Senior Backend Developer."
        />
        <TextField
          label="Salary"
          name="salary"
          inputMode="decimal"
          value={values.salary}
          onChange={update('salary')}
          error={errors.salary}
          required
          autoComplete="off"
          hint="Yearly gross amount."
        />
        <TextField
          label="Address"
          name="address"
          value={values.address}
          onChange={update('address')}
          error={errors.address}
          required
          maxLength={MAX_TEXT_LENGTH}
          autoComplete="off"
        />
      </div>
      {departments.length > 0 && (
        <datalist id={departmentListId}>
          {departments.map((department) => (
            <option key={department} value={department} />
          ))}
        </datalist>
      )}

      <div className="form__actions">
        <button type="submit" className="button button--primary" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'create' ? 'Create employee' : 'Save changes'}
        </button>
        <Link to={cancelTo} className="button">
          Cancel
        </Link>
      </div>
    </form>
  );
}
