import { X } from 'lucide-react';
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../i18n/context';
import { FOCUSABLE, trapFocus } from './focus';
import './Dialog.css';

interface DialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  /** Blocks Escape/backdrop while a request is running. */
  busy?: boolean;
  role?: 'dialog' | 'alertdialog';
  /** Element to focus first; defaults to the first focusable element. */
  initialFocus?: React.RefObject<HTMLElement | null>;
  size?: 'sm' | 'md';
}

/**
 * Modal dialog: focus moves inside and is trapped there, Escape and the backdrop close it, the page
 * behind is inert, and focus returns to the element that opened it.
 */
export function Dialog({ open, title, description, children, footer, onClose, busy = false, role = 'dialog', initialFocus, size = 'sm' }: DialogProps) {
  const { t } = useI18n();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');
    const target = initialFocus?.current ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panelRef.current;
    target?.focus();
    return () => {
      root?.removeAttribute('inert');
      previouslyFocused?.focus();
    };
  }, [open, initialFocus]);

  if (!open) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && !busy) {
      event.stopPropagation();
      onClose();
      return;
    }
    trapFocus(event, panelRef.current);
  };

  return createPortal(
    <div className="dialog-backdrop" onMouseDown={busy ? undefined : onClose}>
      <div
        ref={panelRef}
        className={`dialog dialog--${size}`}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog__header">
          <h2 id={titleId} className="dialog__title">
            {title}
          </h2>
          <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={onClose} disabled={busy} aria-label={t('common.close')}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        {description && (
          <div id={descriptionId} className="dialog__description">
            {description}
          </div>
        )}
        {children && <div className="dialog__body">{children}</div>}
        {footer && <div className="dialog__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  error?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation for destructive actions. Focus starts on Cancel, the safe choice. */
export function ConfirmDialog({ open, title, children, confirmLabel, busy = false, error, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useI18n();
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog
      open={open}
      role="alertdialog"
      title={title}
      description={children}
      onClose={onCancel}
      busy={busy}
      initialFocus={cancelRef}
      footer={
        <>
          <button ref={cancelRef} type="button" className="btn btn--secondary" onClick={onCancel} disabled={busy}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={busy} aria-busy={busy}>
            {busy ? t('common.working') : confirmLabel}
          </button>
        </>
      }
    >
      {error}
    </Dialog>
  );
}
