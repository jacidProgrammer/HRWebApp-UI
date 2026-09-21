import { Banknote, CalendarDays, Mail, MapPin, UserX } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useMyEmployee, useUpdateContactDetails } from '../../api/hooks';
import type { Employee } from '../../api/types';
import { usePageTitle } from '../../components/shell/pageTitle';
import { Alert, ErrorState } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { TextField } from '../../components/ui/Field';
import { LoadingRegion, Skeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/toastContext';
import { useI18n } from '../../i18n/context';
import { describeError } from '../../lib/errors';
import { useFormat } from '../../lib/format';
import { hasErrors, validateContactDetails, type ContactFormValues, type FieldErrors } from '../../lib/validation';
import { PersonHeader } from '../people/PersonHeader';
import './MyProfilePage.css';

function ContactForm({ employee }: { employee: Employee }) {
  const { t } = useI18n();
  const toast = useToast();
  const update = useUpdateContactDetails(employee.id);
  const initial = { email: employee.email, address: employee.address ?? '' };
  const [values, setValues] = useState<ContactFormValues>(initial);
  const [errors, setErrors] = useState<FieldErrors<keyof ContactFormValues>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ContactFormValues, boolean>>>({});
  const dirty = values.email.trim() !== initial.email || values.address.trim() !== initial.address;

  const change = (field: keyof ContactFormValues, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (touched[field]) setErrors(validateContactDetails(next));
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateContactDetails(values);
    setErrors(found);
    setTouched({ email: true, address: true });
    if (hasErrors(found)) return;
    update.mutate(
      { email: values.email.trim(), address: values.address.trim() },
      { onSuccess: () => toast.show({ title: t('profile.saved') }) },
    );
  };

  return (
    <form className="card" onSubmit={onSubmit} noValidate aria-labelledby="contact-heading">
      <div className="card__header">
        <div>
          <h2 id="contact-heading" className="card__title">
            {t('profile.contact.title')}
          </h2>
          <p className="card__subtitle">{t('profile.contact.subtitle')}</p>
        </div>
      </div>
      <div className="card__body profile-form">
        <TextField
          label={t('field.email')}
          type="email"
          autoComplete="email"
          value={values.email}
          leading={<Mail size={16} />}
          onChange={(event) => change('email', event.target.value)}
          onBlur={() => {
            setTouched((v) => ({ ...v, email: true }));
            setErrors(validateContactDetails(values));
          }}
          error={touched.email && errors.email ? t(errors.email) : undefined}
        />
        <TextField
          label={t('field.address')}
          autoComplete="street-address"
          value={values.address}
          leading={<MapPin size={16} />}
          onChange={(event) => change('address', event.target.value)}
          onBlur={() => {
            setTouched((v) => ({ ...v, address: true }));
            setErrors(validateContactDetails(values));
          }}
          error={touched.address && errors.address ? t(errors.address) : undefined}
        />
        {update.isError && (
          <Alert tone="danger" title={describeError(update.error, t).title} live>
            {describeError(update.error, t).message}
          </Alert>
        )}
      </div>
      <div className="form-footer">
        <p className="form-footer__note">{t('profile.contact.note')}</p>
        <button type="submit" className="btn btn--primary" disabled={!dirty || update.isPending} aria-busy={update.isPending}>
          {update.isPending ? t('common.saving') : t('common.saveChanges')}
        </button>
      </div>
    </form>
  );
}

export function MyProfilePage() {
  const { t } = useI18n();
  const format = useFormat();
  usePageTitle(t('profile.title'));
  const me = useMyEmployee();

  if (me.isPending) {
    return (
      <LoadingRegion>
        <div className="page">
          <Skeleton height={180} radius={12} />
          <Skeleton height={240} radius={12} />
        </div>
      </LoadingRegion>
    );
  }
  if (me.isError) {
    if (me.error.kind === 'NOT_FOUND') {
      return (
        <EmptyState icon={UserX} tone="neutral" title={t('profile.missing.title')}>
          {t('profile.missing.body')}
        </EmptyState>
      );
    }
    return <ErrorState error={me.error} onRetry={() => void me.refetch()} />;
  }

  const employee = me.data;
  return (
    <div className="page">
      <PersonHeader employee={employee} badge={<span className="badge badge--accent">{t('people.you')}</span>} />
      <div className="profile-grid">
        <ContactForm key={`${employee.email}|${employee.address ?? ''}`} employee={employee} />
        <section className="card" aria-labelledby="private-heading">
          <div className="card__header">
            <div>
              <h2 id="private-heading" className="card__title">
                {t('profile.private.title')}
              </h2>
              <p className="card__subtitle">{t('profile.private.subtitle')}</p>
            </div>
          </div>
          <dl className="card__body meta-list">
            <div className="meta-list__row">
              <dt>
                <Banknote size={16} aria-hidden="true" />
                {t('field.salary')}
              </dt>
              <dd className="tabular">{employee.salary !== null ? format.currency(employee.salary) : '–'}</dd>
            </div>
            <div className="meta-list__row">
              <dt>
                <MapPin size={16} aria-hidden="true" />
                {t('field.address')}
              </dt>
              <dd>{employee.address ?? '–'}</dd>
            </div>
            <div className="meta-list__row">
              <dt>
                <CalendarDays size={16} aria-hidden="true" />
                {t('field.memberSince')}
              </dt>
              <dd>{format.date(employee.createdAt)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
