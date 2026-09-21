import { ArrowRight, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Feedback } from '../../api/types';
import { Avatar } from '../../components/ui/Avatar';
import { ValueTag } from '../../components/ui/Chips';
import { SentimentIndicator } from '../../components/ui/SentimentIndicator';
import { useI18n } from '../../i18n/context';
import { useFormat } from '../../lib/format';
import { useAuthorLabel } from './authorLabel';
import './FeedbackCard.css';

export type FeedbackPerspective = 'received' | 'sent' | 'about' | 'all';

interface FeedbackCardProps {
  feedback: Feedback;
  /**
   * received: from whom (employee inbox) · sent: to whom (employee outbox)
   * about: from whom, in a manager's person page · all: from whom to whom (manager explorer)
   */
  perspective: FeedbackPerspective;
}

export function FeedbackCard({ feedback, perspective }: FeedbackCardProps) {
  const { t } = useI18n();
  const format = useFormat();
  const authorLabel = useAuthorLabel()(feedback);
  const hiddenAuthor = !feedback.authorName;

  const avatar =
    perspective === 'sent' ? (
      <Avatar name={feedback.recipientName} size="md" />
    ) : (
      <Avatar name={authorLabel} size="md" anonymous={hiddenAuthor} />
    );

  const recipient =
    perspective === 'all' ? (
      <Link to={`/people/${feedback.recipientId}`} className="feedback-card__person">
        {feedback.recipientName}
      </Link>
    ) : (
      <span className="feedback-card__person">{feedback.recipientName}</span>
    );

  return (
    <article className="feedback-card" aria-label={t('feedback.cardLabel', { author: perspective === 'sent' ? feedback.recipientName : authorLabel })}>
      <header className="feedback-card__header">
        {avatar}
        <div className="feedback-card__who">
          <p className="feedback-card__line">
            {perspective === 'sent' ? (
              <>
                <span className="feedback-card__muted">{t('feedback.to')}</span> {recipient}
              </>
            ) : perspective === 'all' ? (
              <>
                <span className={hiddenAuthor ? 'feedback-card__anon' : 'feedback-card__person'}>{authorLabel}</span>
                <ArrowRight size={14} className="feedback-card__arrow" aria-label={t('feedback.toArrow')} />
                {recipient}
              </>
            ) : (
              <span className={hiddenAuthor ? 'feedback-card__anon' : 'feedback-card__person'}>{authorLabel}</span>
            )}
          </p>
          <time className="feedback-card__time" dateTime={feedback.createdAt} title={format.dateTime(feedback.createdAt)}>
            {format.relative(feedback.createdAt)}
          </time>
        </div>
        {perspective === 'sent' && feedback.anonymous && (
          <span className="badge feedback-card__badge">
            <EyeOff size={12} aria-hidden="true" />
            {t('feedback.sentAnonymously')}
          </span>
        )}
      </header>
      <p className="feedback-card__message">{feedback.message}</p>
      <footer className="feedback-card__footer">
        {feedback.value ? <ValueTag value={feedback.value} /> : <span />}
        <SentimentIndicator sentiment={feedback.sentiment} />
      </footer>
    </article>
  );
}

export function FeedbackList({ items, perspective }: { items: Feedback[]; perspective: FeedbackPerspective }) {
  return (
    <ul className="feedback-list">
      {items.map((item) => (
        <li key={item.id}>
          <FeedbackCard feedback={item} perspective={perspective} />
        </li>
      ))}
    </ul>
  );
}
