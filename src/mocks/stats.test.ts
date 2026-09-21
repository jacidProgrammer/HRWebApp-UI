import { describe, expect, it } from 'vitest';
import { createSeed } from './seed';
import { computeOverview } from './stats';

const NOW = new Date('2026-09-21T12:00:00Z');

describe('demo seed + computeOverview', () => {
  const seed = createSeed(NOW);
  const overview = computeOverview(seed.employees, seed.feedback, NOW);

  it('seeds about 12 employees in 4 departments and about 50 feedback items', () => {
    expect(seed.employees).toHaveLength(12);
    expect(overview.departments.map((d) => d.name).sort()).toEqual(['Finance', 'IT', 'People', 'Sales']);
    expect(seed.feedback.length).toBeGreaterThanOrEqual(45);
    expect(seed.feedback.length).toBeLessThanOrEqual(60);
    expect(seed.feedback.some((f) => f.anonymous)).toBe(true);
  });

  it('never has feedback addressed to its own author', () => {
    expect(seed.feedback.filter((f) => f.authorId === f.recipientId)).toEqual([]);
  });

  it('raises exactly one alert: Maria dropped from 80% to 40% positive', () => {
    expect(overview.alerts).toEqual([
      expect.objectContaining({ name: 'Maria Rossi', department: 'Sales', previousPositiveShare: 0.8, currentPositiveShare: 0.4, feedbackCount: 5 }),
    ]);
  });

  it('returns one zero-filled trend entry per month, oldest first, that adds up', () => {
    expect(overview.trend.map((t) => t.month)).toEqual(['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']);
    const inTrend = overview.trend.reduce((sum, t) => sum + t.positive + t.neutral + t.negative + t.notAnalysed, 0);
    expect(inTrend).toBeLessThanOrEqual(overview.feedback.total);
    expect(overview.trend.at(-1)).toMatchObject({ month: '2026-09' });
    const last = overview.trend.at(-1);
    expect(last && last.positive + last.neutral + last.negative + last.notAnalysed).toBe(overview.feedback.thisMonth);
  });

  it('limits the top recognised list to five, most recognised first', () => {
    expect(overview.topRecognised.length).toBeLessThanOrEqual(5);
    const counts = overview.topRecognised.map((t) => t.count);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });
});
