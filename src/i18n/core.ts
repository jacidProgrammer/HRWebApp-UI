import type { en } from './locales/en';

/**
 * A tiny typed i18n layer: English is the source of truth, every other locale must provide the same keys
 * (checked by the compiler), `{name}` placeholders are interpolated and `_one`/`_other` keys handle plurals.
 */
export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;

type PluralBase<K> = K extends `${infer Base}_other` ? Base : never;
export type PluralKey = PluralBase<MessageKey>;

export const LOCALES = ['en', 'es', 'de'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Language names are written in their own language, so everyone can find theirs. */
export const LANGUAGE_NAMES: Record<Locale, string> = { en: 'English', es: 'Español', de: 'Deutsch' };

/** BCP 47 tags used for Intl formatting (European conventions for English too). */
export const INTL_LOCALE: Record<Locale, string> = { en: 'en-GB', es: 'es-ES', de: 'de-DE' };

export type Vars = Record<string, string | number>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Picks the first supported language from the browser's preferences, falling back to English. */
export function detectLocale(preferred: readonly string[] | undefined): Locale {
  for (const tag of preferred ?? []) {
    const language = tag.toLowerCase().split('-')[0];
    if (isLocale(language)) return language;
  }
  return DEFAULT_LOCALE;
}

export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/** Looks a key up in the active dictionary, then in English, then returns the key itself. */
export function translate(
  dictionaries: Partial<Record<Locale, Partial<Messages>>>,
  locale: Locale,
  key: MessageKey,
  vars?: Vars,
): string {
  const template = dictionaries[locale]?.[key] ?? dictionaries[DEFAULT_LOCALE]?.[key] ?? key;
  return interpolate(template, vars);
}

export function pluralKey(locale: Locale, base: PluralKey, count: number): MessageKey {
  const category = new Intl.PluralRules(INTL_LOCALE[locale]).select(count);
  return category === 'one' ? `${base}_one` : `${base}_other`;
}
