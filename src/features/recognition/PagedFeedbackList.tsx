import { useState } from 'react';
import type { Feedback } from '../../api/types';
import { useI18n } from '../../i18n/context';
import { FeedbackList, type FeedbackPerspective } from './FeedbackCard';
import './PagedFeedbackList.css';

interface PagedFeedbackListProps {
  items: Feedback[];
  perspective: FeedbackPerspective;
  /** How many items to show at first, and to add on each "Show more". */
  pageSize: number;
}

/**
 * Renders a long feedback history a page at a time, so it stays quick to scan. Give it a `key` that changes
 * with the filters, so a new result set starts again from the first page.
 */
export function PagedFeedbackList({ items, perspective, pageSize }: PagedFeedbackListProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(pageSize);
  const shown = Math.min(visible, items.length);
  const remaining = items.length - shown;
  return (
    <>
      <FeedbackList items={items.slice(0, shown)} perspective={perspective} />
      {remaining > 0 && (
        <div className="paged-list__more">
          <button type="button" className="btn btn--secondary" onClick={() => setVisible((v) => v + pageSize)}>
            {t('feedback.showMore', { count: Math.min(pageSize, remaining) })}
          </button>
          <p className="paged-list__note" aria-live="polite">
            {t('feedback.showing', { shown, total: items.length })}
          </p>
        </div>
      )}
    </>
  );
}
