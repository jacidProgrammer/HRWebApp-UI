import { createContext, useContext } from 'react';
import type { Locale, MessageKey, PluralKey, Vars } from './core';

export interface I18nContextValue {
  locale: Locale;
  /** BCP 47 tag for Intl formatters. */
  intlLocale: string;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Vars) => string;
  /** Plural-aware translation: `{count}` is available in the message. */
  tp: (base: PluralKey, count: number, vars?: Vars) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside <I18nProvider>');
  return value;
}
