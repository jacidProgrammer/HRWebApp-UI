/**
 * Calendar dates (`YYYY-MM-DD`, no time or zone) shown and typed in the app's locale, not the browser's.
 * A native `<input type="date">` always follows the browser language (mm/dd/yyyy in an American Chrome,
 * even with the app in German), so the date field is built on these helpers instead.
 */

export type DatePart = 'day' | 'month' | 'year';

export interface DatePattern {
  /** Order of the parts in the locale's numeric date: `['day', 'month', 'year']` for en-GB, es and de. */
  order: DatePart[];
  /** Separator between the parts: `/` for en-GB and es-ES, `.` for de-DE. */
  separator: string;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export function isIsoDate(value: string | null | undefined): boolean {
  const match = value ? ISO_DATE.exec(value) : null;
  return !!match && isRealDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

function isRealDate(year: number, month: number, day: number): boolean {
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

export const toIsoDate = (year: number, month: number, day: number) => `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

/** `[year, month (1-12), day]` of an ISO date. */
export function isoParts(iso: string): [number, number, number] {
  const [year = 1970, month = 1, day = 1] = iso.split('-').map(Number);
  return [year, month, day];
}

const toUtc = (iso: string) => {
  const [year, month, day] = isoParts(iso);
  return new Date(Date.UTC(year, month - 1, day));
};
const fromUtc = (date: Date) => toIsoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());

/** Today in the user's time zone. */
export function todayIso(now: Date = new Date()): string {
  return toIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export const addDays = (iso: string, days: number) => fromUtc(new Date(toUtc(iso).getTime() + days * DAY_MS));

/** Moves by whole months, clamping the day: 31 Jan + 1 month = 28/29 Feb. */
export function addMonths(iso: string, months: number): string {
  const [year, month, day] = isoParts(iso);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return toIsoDate(target.getUTCFullYear(), target.getUTCMonth() + 1, Math.min(day, lastDay));
}

/** 0 = Sunday ... 6 = Saturday. */
export const weekday = (iso: string) => toUtc(iso).getUTCDay();

export const clampDate = (iso: string, min?: string, max?: string) =>
  min && iso < min ? min : max && iso > max ? max : iso;

export function datePattern(locale: string): DatePattern {
  const parts = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).formatToParts(
    new Date(Date.UTC(2026, 10, 23)),
  );
  const order = parts.map((part) => part.type).filter((type): type is DatePart => type === 'day' || type === 'month' || type === 'year');
  const separator = parts.find((part) => part.type === 'literal')?.value.trim() || '/';
  return order.length === 3 ? { order, separator } : { order: ['day', 'month', 'year'], separator: '/' };
}

/** `21/09/2026` (en-GB, es-ES) or `21.09.2026` (de-DE): the numeric form users type. */
export function formatIsoDate(iso: string, locale: string): string {
  const [year, month, day] = isoParts(iso);
  const { order, separator } = datePattern(locale);
  const values: Record<DatePart, string> = { day: pad(day), month: pad(month), year: pad(year, 4) };
  return order.map((part) => values[part]).join(separator);
}

/**
 * The format as the user reads it, from localised letters for day, month and year (`DMY`, `DMA`, `TMJ`):
 * `DD/MM/YYYY`, `DD/MM/AAAA`, `TT.MM.JJJJ`.
 */
export function formatHint(locale: string, letters: string): string {
  const { order, separator } = datePattern(locale);
  const [d = 'D', m = 'M', y = 'Y'] = [...letters];
  const shapes: Record<DatePart, string> = { day: d.repeat(2), month: m.repeat(2), year: y.repeat(4) };
  return order.map((part) => shapes[part]).join(separator);
}

/**
 * Reads a date typed in the locale's order with any separator (`21/9/2026`, `21.09.26`, `21-09-2026`),
 * as eight digits (`21092026`) or as an ISO date. Two-digit years mean 20xx. Returns null if it isn't a
 * real calendar date.
 */
export function parseDate(text: string, locale: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (isIsoDate(trimmed)) return trimmed;

  const { order } = datePattern(locale);
  let pieces = trimmed.split(/[^\d]+/).filter(Boolean);
  if (pieces.length === 1 && /^\d{8}$/.test(trimmed)) {
    // Digits only, in the locale order: DDMMYYYY or MMDDYYYY (or YYYYMMDD).
    let rest = trimmed;
    pieces = order.map((part) => {
      const size = part === 'year' ? 4 : 2;
      const piece = rest.slice(0, size);
      rest = rest.slice(size);
      return piece;
    });
  }
  if (pieces.length !== 3) return null;

  const values = Object.fromEntries(order.map((part, index) => [part, pieces[index] ?? ''])) as Record<DatePart, string>;
  if (values.year.length !== 2 && values.year.length !== 4) return null;
  if (values.day.length > 2 || values.month.length > 2) return null;
  const year = values.year.length === 2 ? 2000 + Number(values.year) : Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);
  return isRealDate(year, month, day) ? toIsoDate(year, month, day) : null;
}

/** First day of the week for the locale (0 = Sunday, 1 = Monday), from `Intl.Locale` week info when available. */
export function firstDayOfWeek(locale: string): number {
  try {
    const info = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const firstDay = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay;
    if (firstDay) return firstDay % 7; // Intl uses 1 = Monday ... 7 = Sunday
  } catch {
    // Unknown locale or no week info: fall through.
  }
  return /-(US|CA|MX|BR|JP|IL)$/i.test(locale) ? 0 : 1;
}

/**
 * The weeks shown for a month: always six rows of seven ISO dates starting on the locale's first weekday,
 * including the days of the neighbouring months that complete the first and last weeks.
 */
export function monthGrid(year: number, month: number, weekStart: number): string[][] {
  const first = toIsoDate(year, month, 1);
  const start = addDays(first, -((weekday(first) - weekStart + 7) % 7));
  return Array.from({ length: 6 }, (_, week) => Array.from({ length: 7 }, (__, day) => addDays(start, week * 7 + day)));
}
