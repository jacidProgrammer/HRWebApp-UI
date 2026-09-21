import { AtSign, Mail, MapPin } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { ApiError } from '../../api/errors';
import type { Employee, EmployeeCreateInput } from '../../api/types';
import { Alert } from '../../components/ui/Alert';
import { TextField } from '../../components/ui/Field';
import { useI18n } from '../../i18n/context';
import { describeError } from '../../lib/errors';
import {
  hasErrors,
  parseSalary,
  validateEmployee,
  type EmployeeField,
  type EmployeeFormValues,
  type FieldErrors,
} from '../../lib/validation';
import './EmployeeForm.css';

interface EmployeeFormProps {
  /** The person being edited; omitted when creating. */
  employee?: Employee;
  departments: string[];
  submitLabel: string;
  busy: boolean;
  error: ApiError | null;
  cancelTo: string;
  onSubmit: (input: EmployeeCreateInput) => void;
}

const EMPTY: EmployeeFormValues = { username: '', name: '', department: '', role: '', email: '', salary: '', address: '' };

function toValues(employee: Employee | undefined): EmployeeFormValues {
  if (!employee) return EMPTY;
  return {
    username: employee.username,
    name: employee.name,
    department: employee.department,
    role: employee.role,
    email: employee.email,
    salary: employee.salary !== null ? String(employee.salary) : '',
    address: employee.address ?? '',
  };
}

/** Create/edit form with inline validation on blur and on submit, mirroring the backend rules. */
export function EmployeeForm({ employee, departments, submitLabel, busy, error, cancelTo, onSubmit }: EmployeeFormProps) {
  const { t } = useI18n();
  const creating = !employee;
  const departmentListId = useId();
  const [values, setValues] = useState<EmployeeFormValues>(() => toValues(employee));
  const [touched, setTouched] = useState<Partial<Record<EmployeeField, boolean>>>({});
  const [errors, setErrors] = useState<FieldErrors<EmployeeField>>({});

  const validate = (next: EmployeeFormValues) => validateEmployee(next, { requireUsername: creating });

  const field = (name: EmployeeField) => ({
    value: values[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = { ...values, [name]: event.target.value };
      setValues(next);
      if (touched[name]) setErrors(validate(next));
    },
    onBlur: () => {
      setTouched((current) => ({ ...current, [name]: true }));
      setErrors(validate(values));
    },
    error: (touched[name] && errors[name] ? t(errors[name]) : undefined) ?? (name === 'username' && error?.kind === 'CONFLICT' ? error.message : undefined),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    setTouched({ username: true, name: true, department: true, role: true, email: true, salary: true, address: true });
    if (hasErrors(found)) {
      window.requestAnimationFrame(() => document.querySelector<HTMLElement>('.employee-form [aria-invalid="true"]')?.focus());
      return;
    }
    onSubmit({
      username: values.username.trim(),
      name: values.name.trim(),
      department: values.department.trim(),
      role: values.role.trim(),
      email: values.email.trim(),
      salary: parseSalary(values.salary) ?? 0,
      address: values.address.trim(),
    });
  };

  const showBanner = error && !(error.kind === 'CONFLICT' && creating);

  return (
    <form className="card employee-form" onSubmit={submit} noValidate>
      <fieldset className="form-section">
        <legend className="form-section__title">{t('form.section.identity')}</legend>
        <p className="form-section__hint">{t('form.section.identityHint')}</p>
        <div className="form-grid">
          <TextField
            label={t('field.username')}
            autoComplete="off"
            spellCheck={false}
            leading={<AtSign size={16} />}
            readOnly={!creating}
            hint={creating ? t('form.usernameHint') : t('form.usernameLocked')}
            {...field('username')}
          />
          <TextField label={t('field.name')} autoComplete="off" {...field('name')} />
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="form-section__title">{t('form.section.job')}</legend>
        <div className="form-grid">
          <TextField label={t('field.department')} list={departmentListId} autoComplete="off" {...field('department')} />
          <datalist id={departmentListId}>
            {departments.map((department) => (
              <option key={department} value={department} />
            ))}
          </datalist>
          <TextField label={t('field.role')} autoComplete="off" {...field('role')} />
          <TextField
            label={t('field.salary')}
            inputMode="decimal"
            autoComplete="off"
            className="tabular"
            leading={<span className="currency-prefix">€</span>}
            hint={t('form.salaryHint')}
            {...field('salary')}
          />
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="form-section__title">{t('form.section.contact')}</legend>
        <div className="form-grid">
          <TextField label={t('field.email')} type="email" autoComplete="off" leading={<Mail size={16} />} {...field('email')} />
          <TextField label={t('field.address')} autoComplete="off" leading={<MapPin size={16} />} {...field('address')} />
        </div>
      </fieldset>

      {showBanner && (
        <div className="employee-form__error">
          <Alert tone="danger" title={describeError(error, t).title} live>
            {describeError(error, t).message}
          </Alert>
        </div>
      )}

      <div className="form-footer">
        <p className="form-footer__note">{t('form.allRequired')}</p>
        <div className="form-footer__actions">
          <Link to={cancelTo} className="btn btn--ghost">
            {t('common.cancel')}
          </Link>
          <button type="submit" className="btn btn--primary" disabled={busy} aria-busy={busy}>
            {busy ? t('common.saving') : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
