import { CheckCircle2, CircleAlert, X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../i18n/context';
import { ToastContext, type ToastOptions } from './toastContext';
import './Toast.css';

interface ToastItem extends ToastOptions {
  id: number;
}

const DURATION_MS = 5000;

/** Toasts for completed actions. They sit in a polite live region, so screen readers announce them. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((toast) => toast.id !== id)), []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { ...options, id }]);
      window.setTimeout(() => dismiss(id), options.duration ?? DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toasts" role="status" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast--${toast.tone ?? 'success'}`}>
              {toast.tone === 'error' ? (
                <CircleAlert size={18} className="toast__icon" aria-hidden="true" />
              ) : (
                <CheckCircle2 size={18} className="toast__icon" aria-hidden="true" />
              )}
              <div className="toast__text">
                <p className="toast__title">{toast.title}</p>
                {toast.description && <p className="toast__description">{toast.description}</p>}
              </div>
              <button type="button" className="toast__close" onClick={() => dismiss(toast.id)} aria-label={t('common.dismiss')}>
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
