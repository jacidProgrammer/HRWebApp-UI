import type { TrendPoint } from '../../api/types';
import type { MessageKey } from '../../i18n/core';

/** Stack order, bottom to top. */
export const TREND_SERIES = ['positive', 'neutral', 'negative', 'notAnalysed'] as const;
export type TrendSeries = (typeof TREND_SERIES)[number];

export const SERIES_LABEL: Record<TrendSeries, MessageKey> = {
  positive: 'sentiment.POSITIVE',
  neutral: 'sentiment.NEUTRAL',
  negative: 'sentiment.NEGATIVE',
  notAnalysed: 'sentiment.NONE',
};

export interface TrendSegment {
  key: TrendSeries;
  value: number;
  /** Cumulative start and end of the segment, in data units. */
  from: number;
  to: number;
}

export interface TrendBar {
  month: string;
  total: number;
  segments: TrendSegment[];
}

export interface TrendChartData {
  bars: TrendBar[];
  /** Top of the y axis: a "nice" number at or above the tallest bar. */
  max: number;
  ticks: number[];
  totals: Record<TrendSeries, number>;
}

/** Rounds a step up to 1, 2 or 5 times a power of ten. */
export function niceStep(raw: number): number {
  if (raw <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return Math.max(1, nice * magnitude);
}

/** Turns the API's monthly counts into stacked bars (empty segments dropped) and a y axis. */
export function buildTrendChart(trend: TrendPoint[], tickCount = 4): TrendChartData {
  const totals: Record<TrendSeries, number> = { positive: 0, neutral: 0, negative: 0, notAnalysed: 0 };
  const bars = trend.map((point) => {
    let running = 0;
    const segments: TrendSegment[] = [];
    for (const key of TREND_SERIES) {
      const value = Math.max(0, point[key]);
      totals[key] += value;
      if (value > 0) segments.push({ key, value, from: running, to: running + value });
      running += value;
    }
    return { month: point.month, total: running, segments };
  });
  const tallest = Math.max(0, ...bars.map((bar) => bar.total));
  const step = niceStep(tallest / tickCount);
  const max = Math.max(step * tickCount, step * Math.ceil(tallest / step));
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  return { bars, max, ticks, totals };
}
