import { toApiError } from '../api/errors';
import type { I18nContextValue } from '../i18n/context';

/**
 * Title and message for an API error in the active language. Business errors keep the backend's own
 * message, which names the field or record involved; everything else gets a translated generic text.
 */
export function describeError(error: unknown, t: I18nContextValue['t']): { title: string; message: string } {
  const apiError = toApiError(error);
  return {
    title: t(`error.${apiError.kind}.title`),
    message: apiError.code ? apiError.message : t(`error.${apiError.kind}.message`),
  };
}
