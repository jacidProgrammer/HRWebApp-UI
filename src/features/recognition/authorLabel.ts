import type { Feedback } from '../../api/types';
import { useI18n } from '../../i18n/context';

/** Name to show for the author: their name, "Anonymous", or "Former colleague" once the author is deleted. */
export function useAuthorLabel() {
  const { t } = useI18n();
  return (feedback: Feedback) =>
    feedback.authorName ?? (feedback.anonymous ? t('feedback.anonymous') : t('feedback.formerColleague'));
}
