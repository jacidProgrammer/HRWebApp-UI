import { useMemo } from 'react';
import { useI18n } from '../i18n/context';

const DAY = 86_400_000;

export interface Formatters {
  date: (iso: string) => string;
  dateTime: (iso: string) => string;
  /** "3 days ago", "yesterday"... falls back to the date after a month. */
  relative: (iso: string, now?: Date) => string;
  number: (value: number) => string;
  percent: (share: number) => string;
  currency: (value: number) => string;
  /** `2026-04` -> "Apr" / "Apr 2026". */
  month: (yearMonth: string, withYear?: boolean) => string;
}

export function createFormatters(locale: string): Formatters {
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  const dateTime = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const number = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
  const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const month = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
  const monthYear = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });

  return {
    date: (iso) => date.format(new Date(iso)),
    dateTime: (iso) => dateTime.format(new Date(iso)),
    relative: (iso, now = new Date()) => {
      const diff = new Date(iso).getTime() - now.getTime();
      const minutes = Math.round(diff / 60_000);
      if (Math.abs(minutes) < 60) return relative.format(Math.min(minutes, 0) === 0 ? 0 : minutes, 'minute');
      const hours = Math.round(diff / 3_600_000);
      if (Math.abs(hours) < 24) return relative.format(hours, 'hour');
      const days = Math.round(diff / DAY);
      if (Math.abs(days) < 7) return relative.format(days, 'day');
      if (Math.abs(days) < 30) return relative.format(Math.round(days / 7), 'week');
      return date.format(new Date(iso));
    },
    number: (value) => number.format(value),
    percent: (share) => percent.format(share),
    currency: (value) => currency.format(value),
    month: (yearMonth, withYear = false) => {
      const [year, monthIndex] = yearMonth.split('-').map(Number);
      const value = new Date(Date.UTC(year ?? 1970, (monthIndex ?? 1) - 1, 1));
      return (withYear ? monthYear : month).format(value);
    },
  };
}

export function useFormat(): Formatters {
  const { intlLocale } = useI18n();
  return useMemo(() => createFormatters(intlLocale), [intlLocale]);
}

export function compareText(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}
