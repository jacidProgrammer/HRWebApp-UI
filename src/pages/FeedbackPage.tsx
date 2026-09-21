import { useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toApiError, type ApiError } from '../api/errors';
import { feedbackApi } from '../api/feedback';
import type { Employee, Feedback } from '../api/types';
import { useAuth } from '../auth/useAuth';
import { FeedbackList } from '../components/FeedbackList';
import { SelectField, TextAreaField } from '../components/FormField';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, ErrorAlert, LoadingState, Notice } from '../components/StatusViews';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useEmployees } from '../hooks/useEmployees';
import { compareText } from '../lib/format';
import {
  hasErrors,
  MAX_TEXT_LENGTH,
  validateFeedback,
  type FeedbackFormValues,
  type FieldErrors,
} from '../lib/validation';

const SENTIMENT_FILTERS = [
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
  { value: 'none', label: 'Not analysed' },
] as const;

interface SendFeedbackFormProps {
  colleagues: readonly Employee[];
  initialColleague: string;
  onSent: (feedback: Feedback) => void;
}

function SendFeedbackForm({ colleagues, initialColleague, onSent }: SendFeedbackFormProps) {
  const [values, setValues] = useState<FeedbackFormValues>({ name: initialColleague, message: '' });
  const [errors, setErrors] = useState<FieldErrors<keyof FeedbackFormValues>>({});
  const [serverError, setServerError] = useState<ApiError | null>(null);
  const [sent, setSent] = useState<Feedback | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateFeedback(values);
    setErrors(validation);
    setServerError(null);
    setSent(null);
    if (hasErrors(validation)) return;

    setSubmitting(true);
    try {
      const created = await feedbackApi.send({ name: values.name, message: values.message.trim() });
      onSent(created);
      setSent(created);
      setValues((current) => ({ ...current, message: '' }));
    } catch (error) {
      setServerError(toApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = MAX_TEXT_LENGTH - values.message.length;

  return (
    <form className="form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
      {sent && (
        <Notice onDismiss={() => setSent(null)}>
          Feedback about {sent.name} was sent.{' '}
          {sent.label
            ? `The sentiment was classified as ${sent.label.toLowerCase()}.`
            : 'Sentiment analysis was not available, so it is shown as not analysed.'}
        </Notice>
      )}
      {serverError && <ErrorAlert error={serverError} title={`Could not send: ${serverError.title.toLowerCase()}`} />}
      <SelectField
        label="Colleague"
        name="name"
        value={values.name}
        onChange={(name) => {
          setValues((current) => ({ ...current, name }));
          setErrors((current) => ({ ...current, name: undefined }));
        }}
        options={colleagues.map((employee) => ({ value: employee.name, label: `${employee.name} · ${employee.role}` }))}
        placeholder="Choose a colleague"
        error={errors.name}
        required
      />
      <TextAreaField
        label="Message"
        name="message"
        rows={5}
        value={values.message}
        onChange={(event) => {
          const message = event.target.value;
          setValues((current) => ({ ...current, message }));
          setErrors((current) => ({ ...current, message: undefined }));
        }}
        error={errors.message}
        required
        maxLength={MAX_TEXT_LENGTH}
        hint={
          <span aria-live="polite">
            {remaining} characters left. Your name is recorded as the author; the message is analysed for sentiment.
          </span>
        }
      />
      <div className="form__actions">
        <button type="submit" className="button button--primary" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send feedback'}
        </button>
      </div>
    </form>
  );
}

/** EMPLOYEE only (every /feedback endpoint requires that role). */
export function FeedbackPage() {
  useDocumentTitle('Feedback');
  const { isSelf } = useAuth();
  const [searchParams] = useSearchParams();
  const employees = useEmployees();
  const feedback = useAsync(feedbackApi.list);
  const [about, setAbout] = useState('');
  const [sentiment, setSentiment] = useState('');

  const colleagues = useMemo(
    () => (employees.data ?? []).filter((employee) => !isSelf(employee.name)).sort((a, b) => compareText(a.name, b.name)),
    [employees.data, isSelf],
  );
  const requested = searchParams.get('about') ?? '';
  const initialColleague = colleagues.find((employee) => employee.name.toLowerCase() === requested.toLowerCase())?.name ?? '';

  const all = useMemo(() => [...(feedback.data ?? [])].reverse(), [feedback.data]);
  const subjects = useMemo(() => [...new Set(all.map((item) => item.name))].sort(compareText), [all]);
  const visible = all.filter(
    (item) =>
      (!about || item.name === about) &&
      (!sentiment || (sentiment === 'none' ? item.label === null : item.label?.toLowerCase() === sentiment)),
  );

  return (
    <>
      <PageHeader
        title="Feedback"
        description="Recognise your colleagues. Every message is classified by an AI sentiment model when it is saved."
      />
      <div className="grid-feedback">
        <section className="panel" aria-labelledby="send-title">
          <h2 id="send-title" className="panel__title">
            Send feedback
          </h2>
          {employees.status === 'loading' && <LoadingState label="Loading colleagues…" />}
          {employees.status === 'error' && <ErrorAlert error={employees.error} onRetry={employees.reload} />}
          {employees.status === 'success' &&
            (colleagues.length === 0 ? (
              <EmptyState title="There is nobody to send feedback to yet" />
            ) : (
              <SendFeedbackForm
                key={initialColleague}
                colleagues={colleagues}
                initialColleague={initialColleague}
                onSent={(created) => feedback.setData((current) => [...current, created])}
              />
            ))}
        </section>

        <section className="panel" aria-labelledby="all-feedback-title">
          <div className="panel__header">
            <h2 id="all-feedback-title" className="panel__title">
              All feedback
            </h2>
            {feedback.status === 'success' && (
              <span className="muted" aria-live="polite">
                {visible.length} of {all.length}
              </span>
            )}
          </div>
          {feedback.status === 'success' && all.length > 0 && (
            <div className="filters filters--compact">
              <SelectField
                label="About"
                value={about}
                onChange={setAbout}
                options={subjects.map((value) => ({ value, label: value }))}
                placeholder="Everyone"
              />
              <SelectField
                label="Sentiment"
                value={sentiment}
                onChange={setSentiment}
                options={SENTIMENT_FILTERS}
                placeholder="Any sentiment"
              />
            </div>
          )}
          {feedback.status === 'loading' && <LoadingState label="Loading feedback…" />}
          {feedback.status === 'error' && <ErrorAlert error={feedback.error} onRetry={feedback.reload} />}
          {feedback.status === 'success' && all.length === 0 && (
            <EmptyState title="No feedback yet">Be the first to recognise a colleague.</EmptyState>
          )}
          {feedback.status === 'success' && all.length > 0 && visible.length === 0 && (
            <EmptyState title="No feedback matches these filters" />
          )}
          {visible.length > 0 && <FeedbackList items={visible} />}
        </section>
      </div>
    </>
  );
}
