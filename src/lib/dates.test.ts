import { describe, expect, it } from 'vitest';
import { addDays, addMonths, datePattern, firstDayOfWeek, formatHint, formatIsoDate, isIsoDate, monthGrid, parseDate, todayIso } from './dates';

describe('date patterns', () => {
  it('follows the locale order and separator, not the browser', () => {
    expect(datePattern('en-GB')).toEqual({ order: ['day', 'month', 'year'], separator: '/' });
    expect(datePattern('de-DE')).toEqual({ order: ['day', 'month', 'year'], separator: '.' });
    expect(datePattern('en-US')).toEqual({ order: ['month', 'day', 'year'], separator: '/' });
  });

  it('formats ISO dates numerically in the locale', () => {
    expect(formatIsoDate('2026-09-01', 'en-GB')).toBe('01/09/2026');
    expect(formatIsoDate('2026-09-01', 'es-ES')).toBe('01/09/2026');
    expect(formatIsoDate('2026-09-01', 'de-DE')).toBe('01.09.2026');
    expect(formatIsoDate('2026-09-01', 'en-US')).toBe('09/01/2026');
  });

  it('describes the format with localised letters', () => {
    expect(formatHint('en-GB', 'DMY')).toBe('DD/MM/YYYY');
    expect(formatHint('es-ES', 'DMA')).toBe('DD/MM/AAAA');
    expect(formatHint('de-DE', 'TMJ')).toBe('TT.MM.JJJJ');
  });
});

describe('parseDate', () => {
  it('reads dates typed in the locale order with any separator', () => {
    expect(parseDate('21/09/2026', 'en-GB')).toBe('2026-09-21');
    expect(parseDate('1.9.2026', 'de-DE')).toBe('2026-09-01');
    expect(parseDate(' 21-9-26 ', 'es-ES')).toBe('2026-09-21');
    expect(parseDate('09/21/2026', 'en-US')).toBe('2026-09-21');
  });

  it('accepts eight digits in the locale order and ISO dates', () => {
    expect(parseDate('21092026', 'de-DE')).toBe('2026-09-21');
    expect(parseDate('2026-09-21', 'de-DE')).toBe('2026-09-21');
  });

  it('rejects impossible or incomplete dates', () => {
    expect(parseDate('31/02/2026', 'en-GB')).toBeNull();
    expect(parseDate('29/02/2025', 'en-GB')).toBeNull();
    expect(parseDate('29/02/2028', 'en-GB')).toBe('2028-02-29');
    expect(parseDate('13/13/2026', 'en-GB')).toBeNull();
    expect(parseDate('21/09', 'en-GB')).toBeNull();
    expect(parseDate('yesterday', 'en-GB')).toBeNull();
    expect(parseDate('', 'en-GB')).toBeNull();
    expect(isIsoDate('2026-02-30')).toBe(false);
  });
});

describe('calendar arithmetic', () => {
  it('adds days across months and years', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('adds months, clamping to the last day', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15');
    expect(addMonths('2026-05-31', 12)).toBe('2027-05-31');
  });

  it('builds six full weeks starting on the locale first weekday', () => {
    const weeks = monthGrid(2026, 9, 1);
    expect(weeks).toHaveLength(6);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    // 1 September 2026 is a Tuesday: the Monday before opens the grid.
    expect(weeks[0]?.[0]).toBe('2026-08-31');
    expect(monthGrid(2026, 9, 0)[0]?.[0]).toBe('2026-08-30');
  });

  it('starts the week on Monday in Europe and on Sunday in the US', () => {
    expect(firstDayOfWeek('de-DE')).toBe(1);
    expect(firstDayOfWeek('en-GB')).toBe(1);
    expect(firstDayOfWeek('en-US')).toBe(0);
  });

  it('gives today in local time', () => {
    expect(todayIso(new Date(2026, 8, 21, 23, 30))).toBe('2026-09-21');
  });
});
