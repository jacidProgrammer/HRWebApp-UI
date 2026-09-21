import type { ReactNode } from 'react';
import type { ApiError } from '../api/errors';

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="state state--empty">
      <p className="state__title">{title}</p>
      {children && <div className="state__body">{children}</div>}
    </div>
  );
}

interface ErrorAlertProps {
  error: ApiError;
  onRetry?: () => void;
  /** Overrides the default title derived from the error kind. */
  title?: string;
}

export function ErrorAlert({ error, onRetry, title }: ErrorAlertProps) {
  return (
    <div className="alert alert--error" role="alert">
      <p className="alert__title">{title ?? error.title}</p>
      <p className="alert__message">{error.message}</p>
      {onRetry && (
        <button type="button" className="button button--small" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Notice({ children, onDismiss }: { children: ReactNode; onDismiss?: () => void }) {
  return (
    <div className="alert alert--success" role="status">
      <p className="alert__message">{children}</p>
      {onDismiss && (
        <button type="button" className="alert__dismiss" onClick={onDismiss} aria-label="Dismiss message">
          ×
        </button>
      )}
    </div>
  );
}
