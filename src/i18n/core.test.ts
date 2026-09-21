import { describe, expect, it } from 'vitest';
import { detectLocale, interpolate, pluralKey, translate, type Messages } from './core';
import { de } from './locales/de';
import { en } from './locales/en';
import { es } from './locales/es';

describe('detectLocale', () => {
  it('picks the first supported language from the browser preferences', () => {
    expect(detectLocale(['fr-FR', 'de-AT', 'en-US'])).toBe('de');
    expect(detectLocale(['es-MX'])).toBe('es');
  });

  it('falls back to English for unsupported or missing preferences', () => {
    expect(detectLocale(['fr', 'it'])).toBe('en');
    expect(detectLocale(undefined)).toBe('en');
  });
});

describe('translate', () => {
  it('falls back to English when a key is missing in the active locale, then to the key itself', () => {
    const partial = { en, de: { 'nav.people': 'Personen' } as Partial<Messages> };

    expect(translate(partial, 'de', 'nav.people')).toBe('Personen');
    expect(translate(partial, 'de', 'nav.settings')).toBe(en['nav.settings']);
    expect(translate({}, 'es', 'nav.settings')).toBe('nav.settings');
  });

  it('interpolates variables and leaves unknown placeholders alone', () => {
    expect(interpolate('Hi {name}, {missing}', { name: 'Maria' })).toBe('Hi Maria, {missing}');
  });

  it('chooses plural forms with the locale rules', () => {
    expect(pluralKey('en', 'people.count', 1)).toBe('people.count_one');
    expect(pluralKey('de', 'people.count', 3)).toBe('people.count_other');
    expect(pluralKey('es', 'people.count', 0)).toBe('people.count_other');
  });
});

describe('dictionaries', () => {
  it('translate every English key with the same placeholders', () => {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '').sort();
    for (const dictionary of [es, de]) {
      expect(Object.keys(dictionary).sort()).toEqual(Object.keys(en).sort());
      for (const key of Object.keys(en) as (keyof typeof en)[]) {
        expect(placeholders(dictionary[key]), key).toEqual(placeholders(en[key]));
      }
    }
  });

  it('address the user formally in German (Sie, not du)', () => {
    const informal = Object.entries(de).filter(([, text]) => /\b(du|dich|dir|dein\w*)\b/i.test(text));
    expect(informal).toEqual([]);
  });
});
