import { describe, expect, it } from 'vitest';
import { buildTrendChart, niceStep } from './trend';

describe('niceStep', () => {
  it('rounds up to 1, 2 or 5 times a power of ten', () => {
    expect([0, 0.3, 1.2, 2.5, 3, 7, 12, 45].map(niceStep)).toEqual([1, 1, 2, 5, 5, 10, 20, 50]);
  });
});

describe('buildTrendChart', () => {
  const chart = buildTrendChart([
    { month: '2026-08', positive: 6, neutral: 2, negative: 1, notAnalysed: 0 },
    { month: '2026-09', positive: 9, neutral: 0, negative: 3, notAnalysed: 2 },
  ]);

  it('stacks positive, neutral, negative and not analysed from the bottom, skipping empty segments', () => {
    expect(chart.bars[0]?.segments).toEqual([
      { key: 'positive', value: 6, from: 0, to: 6 },
      { key: 'neutral', value: 2, from: 6, to: 8 },
      { key: 'negative', value: 1, from: 8, to: 9 },
    ]);
    expect(chart.bars[1]?.segments.map((s) => s.key)).toEqual(['positive', 'negative', 'notAnalysed']);
    expect(chart.bars.map((b) => b.total)).toEqual([9, 14]);
  });

  it('builds a y axis with round ticks that covers the tallest bar', () => {
    expect(chart.max).toBeGreaterThanOrEqual(14);
    expect(chart.ticks).toEqual([0, 5, 10, 15, 20]);
  });

  it('sums every series for the legend', () => {
    expect(chart.totals).toEqual({ positive: 15, neutral: 2, negative: 4, notAnalysed: 2 });
  });

  it('still draws an axis when there is no data', () => {
    const empty = buildTrendChart([{ month: '2026-09', positive: 0, neutral: 0, negative: 0, notAnalysed: 0 }]);
    expect(empty.ticks).toEqual([0, 1, 2, 3, 4]);
    expect(empty.bars[0]?.segments).toEqual([]);
  });
});
