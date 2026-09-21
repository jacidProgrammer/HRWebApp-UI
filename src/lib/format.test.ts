import { describe, expect, it } from 'vitest';
import { createFormatters } from './format';

const normalize = (value: string) => value.replace(/\s/g, ' ');

describe('createFormatters', () => {
  it('formats salaries in euros with the active locale', () => {
    expect(normalize(createFormatters('de-DE').currency(75600))).toBe('75.600 €');
    expect(createFormatters('en-GB').currency(75600)).toBe('€75,600');
  });

  it('formats shares as percentages', () => {
    expect(createFormatters('en-GB').percent(0.71)).toBe('71%');
    expect(normalize(createFormatters('es-ES').percent(0.4))).toBe('40 %');
  });

  it('turns API months into short month names in UTC', () => {
    expect(createFormatters('en-GB').month('2026-04')).toBe('Apr');
    expect(createFormatters('de-DE').month('2026-03', true)).toBe('März 2026');
  });

  it('describes recent dates relatively and older ones as dates', () => {
    const format = createFormatters('en-GB');
    const now = new Date('2026-09-21T12:00:00Z');
    expect(format.relative('2026-09-20T12:00:00Z', now)).toBe('yesterday');
    expect(format.relative('2026-09-11T12:00:00Z', now)).toBe('last week');
    expect(format.relative('2026-06-01T12:00:00Z', now)).toBe('1 Jun 2026');
  });
});
