import { ArrowLeft, Banknote, Briefcase, Building2, CalendarDays, Mail, MapPin, MessageSquareDashed, MoreHorizontal, Pencil, Send, Trash2, UserX } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEmployee, useFeedbackList } from '../../api/hooks';
import type { Employee } from '../../api/types';
import { useAuth } from '../../auth/useAuth';
import { usePageTitle } from '../../components/shell/pageTitle';
import { ErrorState } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { MenuButton } from '../../components/ui/Menu';
import { LoadingRegion, Skeleton, SkeletonList } from '../../components/ui/Skeleton';
import { useI18n } from '../../i18n/context';
import { useFormat } from '../../lib/format';
import { PagedFeedbackList } from '../recognition/PagedFeedbackList';
import { DeletePersonDialog } from './DeletePersonDialog';
import { isMissingPerson } from './missingPerson';
import { PersonHeader } from './PersonHeader';
import { SentimentSummary } from './SentimentSummary';
import './PersonPage.css';

function Details({ employee }: { employee: Employee }) {
  const { t } = useI18n();
  const format = useFormat();
  return (
    <section className="card" aria-labelledby="details-heading">
      <div className="card__header">
        <h2 id="details-heading" className="card__title">
          {t('person.details')}
        </h2>
      </div>
      <dl className="card__body meta-list">
        <div className="meta-list__row">
          <dt><Mail size={16} aria-hidden="true" />{t('field.email')}</dt>
          <dd><a href={`mailto:${employee.email}`}>{employee.email}</a></dd>
        </div>
        <div className="meta-list__row">
          <dt><Building2 size={16} aria-hidden="true" />{t('field.department')}</dt>
          <dd>{employee.department}</dd>
        </div>
        <div className="meta-list__row">
          <dt><Briefcase size={16} aria-hidden="true" />{t('field.role')}</dt>
          <dd>{employee.role}</dd>
        </div>
        {employee.salary !== null && (
          <div className="meta-list__row">
            <dt><Banknote size={16} aria-hidden="true" />{t('field.salary')}</dt>
            <dd className="tabular">{format.currency(employee.salary)}</dd>
          </div>
        )}
        {employee.address !== null && (
          <div className="meta-list__row">
            <dt><MapPin size={16} aria-hidden="true" />{t('field.address')}</dt>
            <dd>{employee.address}</dd>
          </div>
        )}
        <div className="meta-list__row">
          <dt><CalendarDays size={16} aria-hidden="true" />{t('field.memberSince')}</dt>
          <dd>{format.date(employee.createdAt)}</dd>
        </div>
      </dl>
    </section>
  );
}

/** Manager view: what colleagues said about this person (anonymous authors stay hidden). */
function FeedbackSummaryCard({ employee }: { employee: Employee }) {
  const { t, tp } = useI18n();
  const feedback = useFeedbackList({ recipientId: employee.id });
  return (
      <section className="card" aria-labelledby="summary-heading">
        <div className="card__header">
          <h2 id="summary-heading" className="card__title">
            {t('person.summary.title')}
          </h2>
          {feedback.data && <span className="badge">{tp('feedback.count', feedback.data.length)}</span>}
        </div>
        <div className="card__body">
          {feedback.isPending ? (
            <LoadingRegion><Skeleton height={120} radius={8} /></LoadingRegion>
          ) : feedback.isError ? (
            <ErrorState error={feedback.error} onRetry={() => void feedback.refetch()} />
          ) : (
            <SentimentSummary items={feedback.data} />
          )}
        </div>
      </section>
  );
}

/** Feedback about a person is shown five at a time; more loads on demand, like the explorer. */
const FEEDBACK_PAGE_SIZE = 5;

function FeedbackAboutList({ employee }: { employee: Employee }) {
  const { t } = useI18n();
  const feedback = useFeedbackList({ recipientId: employee.id });
  return (
      <section className="person-feedback" aria-labelledby="about-heading">
        <h2 id="about-heading" className="section-title">
          {t('person.feedbackAbout', { name: employee.name.split(' ')[0] ?? employee.name })}
        </h2>
        {feedback.isPending ? (
          <SkeletonList rows={3} />
        ) : feedback.isError ? null : feedback.data.length === 0 ? (
          <div className="card">
            <EmptyState icon={MessageSquareDashed} tone="neutral" compact title={t('person.noFeedback.title')}>
              {t('person.noFeedback.body')}
            </EmptyState>
          </div>
        ) : (
          <PagedFeedbackList key={employee.id} items={feedback.data} perspective="about" pageSize={FEEDBACK_PAGE_SIZE} />
        )}
      </section>
  );
}

export function PersonPage() {
  const { id = '' } = useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { hasRole, isSelf } = useAuth();
  const isManager = hasRole('MANAGER');
  const employee = useEmployee(id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  usePageTitle(employee.data?.name ?? t('person.title'));

  const back = (
    <Link to="/people" className="back-link">
      <ArrowLeft size={16} aria-hidden="true" />
      {isManager ? t('person.backPeople') : t('person.backDirectory')}
    </Link>
  );

  if (employee.isPending) {
    return (
      <div className="page">
        {back}
        <LoadingRegion>
          <div className="page">
            <Skeleton height={180} radius={12} />
            <Skeleton height={260} radius={12} />
          </div>
        </LoadingRegion>
      </div>
    );
  }
  if (employee.isError) {
    return (
      <div className="page">
        {back}
        {isMissingPerson(employee.error) ? (
          <EmptyState icon={UserX} tone="neutral" title={t('person.notFound.title')}>
            {t('person.notFound.body')}
          </EmptyState>
        ) : (
          <ErrorState error={employee.error} onRetry={() => void employee.refetch()} />
        )}
      </div>
    );
  }

  const person = employee.data;
  const self = isSelf(person.username);
  const actions = isManager ? (
    <>
      <Link to={`/people/${person.id}/edit`} className="btn btn--secondary">
        <Pencil size={16} aria-hidden="true" />
        {t('common.edit')}
      </Link>
      <MenuButton
        label={t('people.actionsFor', { name: person.name })}
        triggerClassName="btn btn--secondary btn--icon"
        entries={[{ id: 'delete', label: t('common.delete'), icon: Trash2, danger: true, onSelect: () => setConfirmDelete(true) }]}
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </MenuButton>
    </>
  ) : self ? (
    <Link to="/profile" className="btn btn--secondary">
      <Pencil size={16} aria-hidden="true" />
      {t('person.editMine')}
    </Link>
  ) : hasRole('EMPLOYEE') ? (
    <Link to={`/recognition/give?to=${encodeURIComponent(person.id)}`} className="btn btn--primary">
      <Send size={16} aria-hidden="true" />
      {t('person.recognise', { name: person.name.split(' ')[0] ?? person.name })}
    </Link>
  ) : null;

  return (
    <div className="page">
      {back}
      <PersonHeader employee={person} badge={self ? <span className="badge badge--accent">{t('people.you')}</span> : undefined} actions={actions} />
      {isManager ? (
        <div className="person-grid">
          <div className="person-grid__main">
            <FeedbackAboutList employee={person} />
          </div>
          <div className="person-grid__side">
            <FeedbackSummaryCard employee={person} />
            <Details employee={person} />
          </div>
        </div>
      ) : (
        <Details employee={person} />
      )}
      <DeletePersonDialog
        employee={confirmDelete ? person : null}
        onClose={() => setConfirmDelete(false)}
        onDeleted={() => void navigate('/people', { replace: true })}
      />
    </div>
  );
}
