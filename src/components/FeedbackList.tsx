import type { Feedback } from '../api/types';
import { SentimentBadge } from './SentimentBadge';

interface FeedbackListProps {
  items: readonly Feedback[];
  /** Hide the "About …" line when every item is about the same person. */
  showSubject?: boolean;
}

export function FeedbackList({ items, showSubject = true }: FeedbackListProps) {
  return (
    <ul className="feedback-list">
      {items.map((item, index) => (
        <li key={`${item.name}-${index}`} className="feedback-item">
          <div className="feedback-item__header">
            {showSubject && (
              <span className="feedback-item__subject">
                About <strong>{item.name}</strong>
              </span>
            )}
            <SentimentBadge label={item.label} score={item.score} />
          </div>
          <blockquote className="feedback-item__message">{item.message}</blockquote>
        </li>
      ))}
    </ul>
  );
}
