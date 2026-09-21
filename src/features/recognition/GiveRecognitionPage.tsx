import { ArrowLeft, BrainCircuit, EyeOff, Send, ShieldOff } from 'lucide-react';
import { useId, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEmployees, useMyEmployee, useSendFeedback, useSettings } from '../../api/hooks';
import { COMPANY_VALUES, type CompanyValue, type Feedback } from '../../api/types';
import { useAuth } from '../../auth/useAuth';
import { usePageTitle } from '../../components/shell/pageTitle';
import { Alert, ErrorState } from '../../components/ui/Alert';
import { TextAreaField } from '../../components/ui/Field';
import { PersonCombobox } from '../../components/ui/PersonCombobox';
import { Skeleton } from '../../components/ui/Skeleton';
import { Switch } from '../../components/ui/Switch';
import { useToast } from '../../components/ui/toastContext';
import { useI18n } from '../../i18n/context';
import { describeError } from '../../lib/errors';
import {
  hasErrors,
  MESSAGE_COUNTER_THRESHOLD,
  MESSAGE_MAX_LENGTH,
  validateRecognition,
  type FieldErrors,
  type RecognitionFormValues,
} from '../../lib/validation';
import { VALUE_META } from '../../lib/values';
import { FeedbackCard } from './FeedbackCard';
import './GiveRecognitionPage.css';

/** Tells the author, before they write, whether their words go through the sentiment model. */
function AnalysisNotice() {
  const { t } = useI18n();
  const settings = useSettings();
  if (settings.isPending) return <Skeleton height={56} radius={8} />;
  if (settings.isError) return null;
  const { sentimentAnalysisEnabled, sentimentAnalysisAvailable } = settings.data;
  if (!sentimentAnalysisEnabled) {
    return (
      <div className="analysis-notice analysis-notice--off">
        <ShieldOff size={18} aria-hidden="true" />
        <p>{t('give.ai.disabled')}</p>
      </div>
    );
  }
  return (
    <div className="analysis-notice">
      <BrainCircuit size={18} aria-hidden="true" />
      <p>{sentimentAnalysisAvailable ? t('give.ai.enabled') : t('give.ai.unavailable')}</p>
    </div>
  );
}

function ValuePicker({ value, onChange }: { value: CompanyValue | null; onChange: (value: CompanyValue | null) => void }) {
  const { t } = useI18n();
  const labelId = useId();
  return (
    <div className="field">
      <div className="field__label-row">
        <span className="field__label" id={labelId}>
          {t('give.value.label')} <span className="field__optional">{t('common.optional')}</span>
        </span>
      </div>
      <div className="value-picker" role="group" aria-labelledby={labelId}>
        {COMPANY_VALUES.map((option) => {
          const { icon: Icon, label, hint } = VALUE_META[option];
          const pressed = value === option;
          return (
            <button
              key={option}
              type="button"
              className={`value-option value-option--${option.toLowerCase()}`}
              aria-pressed={pressed}
              title={t(hint)}
              onClick={() => onChange(pressed ? null : option)}
            >
              <Icon size={16} aria-hidden="true" />
              {t(label)}
            </button>
          );
        })}
      </div>
      <p className="field__hint">{value ? t(VALUE_META[value].hint) : t('give.value.hint')}</p>
    </div>
  );
}

export function GiveRecognitionPage() {
  const { t, tp } = useI18n();
  const { isSelf, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  usePageTitle(t('give.title'));

  const employees = useEmployees();
  const me = useMyEmployee();
  const send = useSendFeedback();
  const anonymousId = useId();
  const anonymousHintId = useId();

  const [values, setValues] = useState<RecognitionFormValues>({ recipientId: params.get('to'), message: '' });
  const [value, setValue] = useState<CompanyValue | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<keyof RecognitionFormValues>>({});
  const [submitted, setSubmitted] = useState(false);

  const colleagues = useMemo(
    () => (employees.data ?? []).filter((employee) => !isSelf(employee.username) && employee.id !== me.data?.id),
    [employees.data, isSelf, me.data?.id],
  );
  const recipient = colleagues.find((c) => c.id === values.recipientId);

  const update = (patch: Partial<RecognitionFormValues>) => {
    const next = { ...values, ...patch };
    setValues(next);
    if (submitted) setErrors(validateRecognition(next));
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const found = validateRecognition(values);
    setErrors(found);
    if (hasErrors(found) || !values.recipientId) {
      // After React has rendered the errors, move focus to the first invalid field.
      window.requestAnimationFrame(() => document.querySelector<HTMLElement>('.give-form [aria-invalid="true"]')?.focus());
      return;
    }
    send.mutate(
      { recipientId: values.recipientId, message: values.message.trim(), value, anonymous },
      {
        onSuccess: (created) => {
          toast.show({
            title: t('give.success.title', { name: created.recipientName }),
            description: anonymous ? t('give.success.anonymous') : undefined,
          });
          void navigate('/recognition?tab=sent');
        },
      },
    );
  };

  const length = values.message.length;
  const remaining = MESSAGE_MAX_LENGTH - length;

  const preview: Feedback = {
    id: 'preview',
    recipientId: recipient?.id ?? '',
    recipientName: recipient?.name ?? t('give.preview.someone'),
    authorId: anonymous ? null : (me.data?.id ?? null),
    authorName: anonymous ? null : (me.data?.name ?? user.displayName),
    anonymous,
    value,
    message: values.message.trim() || t('give.preview.placeholder'),
    sentiment: null,
    createdAt: new Date().toISOString(),
  };

  if (employees.isError) return <ErrorState error={employees.error} onRetry={() => void employees.refetch()} />;

  return (
    <div className="page">
      <Link to="/recognition" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" />
        {t('give.back')}
      </Link>

      <div className="give-layout">
        <form className="card give-form" onSubmit={onSubmit} noValidate aria-labelledby="give-heading">
          <div className="card__header card__header--plain">
            <div>
              <h2 id="give-heading" className="card__title">
                {t('give.heading')}
              </h2>
              <p className="card__subtitle">{t('give.subtitle')}</p>
            </div>
          </div>
          <div className="card__body give-form__body">
            {employees.isPending ? (
              <Skeleton height={64} radius={8} />
            ) : (
              <PersonCombobox
                label={t('give.recipient.label')}
                placeholder={t('give.recipient.placeholder')}
                people={colleagues}
                value={values.recipientId}
                onChange={(recipientId) => update({ recipientId })}
                error={errors.recipientId && t(errors.recipientId)}
              />
            )}

            <ValuePicker value={value} onChange={setValue} />

            <TextAreaField
              label={t('give.message.label')}
              placeholder={t('give.message.placeholder')}
              value={values.message}
              maxLength={MESSAGE_MAX_LENGTH}
              rows={5}
              onChange={(event) => update({ message: event.target.value })}
              error={errors.message && t(errors.message)}
              counter={
                length >= MESSAGE_COUNTER_THRESHOLD ? (
                  <span className={`char-counter${remaining <= 20 ? ' char-counter--danger' : ''}`} aria-live="polite">
                    {tp('give.message.remaining', remaining)}
                  </span>
                ) : undefined
              }
            />

            <div className="toggle-row">
              <div className="toggle-row__text">
                <span id={anonymousId} className="toggle-row__label">
                  <EyeOff size={16} aria-hidden="true" />
                  {t('give.anonymous.label')}
                </span>
                <span id={anonymousHintId} className="toggle-row__hint">
                  {t('give.anonymous.hint')}
                </span>
              </div>
              <Switch checked={anonymous} onChange={setAnonymous} labelledBy={anonymousId} describedBy={anonymousHintId} />
            </div>

            <AnalysisNotice />

            {send.isError && (
              <Alert tone="danger" title={describeError(send.error, t).title} live>
                {describeError(send.error, t).message}
              </Alert>
            )}
          </div>
          <div className="give-form__footer">
            <Link to="/recognition" className="btn btn--ghost">
              {t('common.cancel')}
            </Link>
            <button type="submit" className="btn btn--primary" disabled={send.isPending} aria-busy={send.isPending}>
              <Send size={16} aria-hidden="true" />
              {send.isPending ? t('give.sending') : t('give.submit')}
            </button>
          </div>
        </form>

        <aside className="give-preview" aria-label={t('give.preview.title')}>
          <p className="give-preview__title">{t('give.preview.title')}</p>
          <div className="give-preview__card" aria-hidden="true">
            <FeedbackCard feedback={preview} perspective="received" />
          </div>
          <p className="give-preview__hint">
            {anonymous ? t('give.preview.anonymousHint') : t('give.preview.hint', { name: recipient?.name ?? t('give.preview.someone') })}
          </p>
        </aside>
      </div>
    </div>
  );
}
