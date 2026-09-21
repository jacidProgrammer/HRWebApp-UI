import { createContext, useContext } from 'react';

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: 'success' | 'error';
  duration?: number;
}

export const ToastContext = createContext<{ show: (options: ToastOptions) => void } | null>(null);

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside <ToastProvider>');
  return value;
}
