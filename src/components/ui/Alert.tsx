import { AlertTriangle, CircleAlert, Info, RotateCw, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { toApiError } from '../../api/errors';
import { useI18n } from '../../i18n/context';
import { describeError } from '../../lib/errors';
import './Alert.css';

interface AlertProps {
  tone: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  /** role="alert" interrupts screen readers: only for errors that appear after an action. */
  live?: boolean;
}

const ICONS = { info: Info, warning: AlertTriangle, danger: CircleAlert, success: Info };

export function Alert({ tone, title, children, action, live = false }: AlertProps) {
  const Icon = ICONS[tone];
  return (
    <div className={`alert alert--${tone}`} role={live ? 'alert' : undefined}>
      <Icon className="alert__icon" size={18} aria-hidden="true" />
      <div className="alert__content">
        {title && <p className="alert__title">{title}</p>}
        {children && <div className="alert__body">{children}</div>}
      </div>
      {action && <div className="alert__action">{action}</div>}
    </div>
  );
}

/** A failed query: the translated reason and a retry button. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useI18n();
  const { title, message } = describeError(error, t);
  const network = toApiError(error).kind === 'NETWORK';
  return (
    <div className="error-state" role="alert">
      <span className="error-state__icon" aria-hidden="true">
        {network ? <WifiOff size={20} /> : <CircleAlert size={20} />}
      </span>
      <div className="error-state__text">
        <p className="error-state__title">{title}</p>
        <p className="error-state__message">{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn btn--secondary btn--sm" onClick={onRetry}>
          <RotateCw size={14} aria-hidden="true" />
          {t('common.tryAgain')}
        </button>
      )}
    </div>
  );
}
