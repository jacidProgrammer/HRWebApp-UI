import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readStorage, writeStorage } from '../lib/storage';
import {
  detectLocale,
  INTL_LOCALE,
  isLocale,
  pluralKey,
  translate,
  type Locale,
  type MessageKey,
  type PluralKey,
  type Vars,
} from './core';
import { I18nContext, type I18nContextValue } from './context';
import { de } from './locales/de';
import { en } from './locales/en';
import { es } from './locales/es';

export const LOCALE_STORAGE_KEY = 'hr.locale';
const DICTIONARIES = { en, es, de };

function initialLocale(): Locale {
  const stored = readStorage(LOCALE_STORAGE_KEY);
  if (isLocale(stored)) return stored;
  return detectLocale(typeof navigator === 'undefined' ? [] : navigator.languages);
}

export function I18nProvider({ children, locale: forced }: { children: ReactNode; locale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(() => forced ?? initialLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeStorage(LOCALE_STORAGE_KEY, next);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: MessageKey, vars?: Vars) => translate(DICTIONARIES, locale, key, vars);
    return {
      locale,
      intlLocale: INTL_LOCALE[locale],
      setLocale,
      t,
      tp: (base: PluralKey, count: number, vars?: Vars) =>
        t(pluralKey(locale, base, count), { count: new Intl.NumberFormat(INTL_LOCALE[locale]).format(count), ...vars }),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
