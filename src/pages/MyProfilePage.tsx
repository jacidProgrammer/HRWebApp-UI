import { useState, type FormEvent } from 'react';
import { employeesApi } from '../api/employees';
import { toApiError, type ApiError } from '../api/errors';
import type { Employee } from '../api/types';
import { useAuth } from '../auth/useAuth';
import { TextField } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, ErrorAlert, LoadingState, Notice } from '../components/StatusViews';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useEmployees } from '../hooks/useEmployees';
import { formatSalary } from '../lib/format';
import {
  hasErrors,
  MAX_TEXT_LENGTH,
  validateContactDetails,
  type ContactFormValues,
  type FieldErrors,
} from '../lib/validation';

function ContactDetailsForm({ employee, onSaved }: { employee: Employee; onSaved: (updated: Employee) => void }) {
  const [values, setValues] = useState<ContactFormValues>({
    email: employee.email,
    address: employee.address ?? '',
  });
  const [errors, setErrors] = useState<FieldErrors<keyof ContactFormValues>>({});
  const [serverError, setServerError] = useState<ApiError | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof ContactFormValues) => (event: { target: { value: string } }) => {
    const value = event.target.value;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSaved(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateContactDetails(values);
    setErrors(validation);
    setServerError(null);
    setSaved(false);
    if (hasErrors(validation)) return;

    setSubmitting(true);
    try {
      const updated = await employeesApi.updateContactDetails(employee.name, {
        email: values.email.trim(),
        address: values.address.trim(),
      });
      onSaved(updated);
      setSaved(true);
    } catch (error) {
      setServerError(toApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
      {saved && <Notice>Your contact details were updated.</Notice>}
      {serverError && <ErrorAlert error={serverError} title={`Could not save: ${serverError.title.toLowerCase()}`} />}
      <div className="form__grid form__grid--single">
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={update('email')}
          error={errors.email}
          required
          maxLength={MAX_TEXT_LENGTH}
        />
        <TextField
          label="Address"
          name="address"
          autoComplete="street-address"
          value={values.address}
          onChange={update('address')}
          error={errors.address}
          required
          maxLength={MAX_TEXT_LENGTH}
        />
      </div>
      <div className="form__actions">
        <button type="submit" className="button button--primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save contact details'}
        </button>
      </div>
    </form>
  );
}

/** EMPLOYEE only: the backend lets employees change their own email and address, nothing else. */
export function MyProfilePage() {
  useDocumentTitle('My profile');
  const { user, isSelf } = useAuth();
  const employees = useEmployees();

  if (employees.status === 'loading') return <LoadingState label="Loading your profile…" />;

  if (employees.status === 'error') {
    return (
      <>
        <PageHeader title="My profile" />
        <ErrorAlert error={employees.error} onRetry={employees.reload} />
      </>
    );
  }

  const me = employees.data.find((employee) => isSelf(employee.name));

  if (!me) {
    return (
      <>
        <PageHeader title="My profile" />
        <EmptyState title="Your account is not linked to an employee record">
          <p>
            You are signed in as <strong>{user.username}</strong>, but no employee has that name. Ask a manager to create
            an employee named “{user.username}”.
          </p>
        </EmptyState>
      </>
    );
  }

  const replaceMe = (updated: Employee) =>
    employees.setData((current) => current.map((employee) => (employee.name === updated.name ? updated : employee)));

  return (
    <>
      <PageHeader title="My profile" description="You can update your contact details. Ask a manager for any other change." />
      <div className="grid-2">
        <section className="panel" aria-labelledby="employment-title">
          <h2 id="employment-title" className="panel__title">
            Employment
          </h2>
          <dl className="details">
            <div className="details__item">
              <dt>Name</dt>
              <dd>{me.name}</dd>
            </div>
            <div className="details__item">
              <dt>Department</dt>
              <dd>{me.department}</dd>
            </div>
            <div className="details__item">
              <dt>Role</dt>
              <dd>{me.role}</dd>
            </div>
            {me.salary !== null && (
              <div className="details__item">
                <dt>Salary</dt>
                <dd>{formatSalary(me.salary)}</dd>
              </div>
            )}
          </dl>
          <p className="muted">Managed by your manager.</p>
        </section>
        <section className="panel" aria-labelledby="contact-title">
          <h2 id="contact-title" className="panel__title">
            Contact details
          </h2>
          <ContactDetailsForm key={me.name} employee={me} onSaved={replaceMe} />
        </section>
      </div>
    </>
  );
}
