import { Table2, BarChart3 } from 'lucide-react';
import { useId, useState } from 'react';
import type { TrendPoint } from '../../api/types';
import { useI18n } from '../../i18n/context';
import { useFormat } from '../../lib/format';
import { buildTrendChart, SERIES_LABEL, TREND_SERIES } from './trend';
import { useElementWidth } from './useElementWidth';
import './SentimentTrendChart.css';

const HEIGHT = 240;
const MARGIN = { top: 12, right: 8, bottom: 28, left: 32 };

/**
 * Stacked monthly bars, hand-drawn in SVG. Every bar is focusable and labelled, a hover/focus tooltip
 * gives exact counts, and the same numbers are one click away as a table.
 */
export function SentimentTrendChart({ trend }: { trend: TrendPoint[] }) {
  const { t } = useI18n();
  const format = useFormat();
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const titleId = useId();
  const chart = buildTrendChart(trend);

  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const band = chart.bars.length ? plotWidth / chart.bars.length : plotWidth;
  const barWidth = Math.min(44, Math.max(12, band * 0.5));
  const y = (value: number) => MARGIN.top + plotHeight - (value / chart.max) * plotHeight;

  const describe = (index: number) => {
    const bar = chart.bars[index];
    if (!bar) return '';
    const parts = TREND_SERIES.map((key) => `${t(SERIES_LABEL[key])} ${trend[index]?.[key] ?? 0}`);
    return `${format.month(bar.month, true)}: ${t('chart.total', { count: bar.total })}. ${parts.join(', ')}`;
  };

  const activeBar = active !== null ? chart.bars[active] : undefined;
  const tooltipLeft = active !== null ? MARGIN.left + band * active + band / 2 : 0;

  return (
    <figure className="trend-chart" aria-labelledby={titleId}>
      <div className="trend-chart__top">
        <ul className="chart-legend" aria-label={t('chart.legend')}>
          {TREND_SERIES.map((key) => (
            <li key={key}>
              <span className={`legend-swatch legend-swatch--${key}`} aria-hidden="true" />
              {t(SERIES_LABEL[key])}
              <span className="chart-legend__value tabular">{format.number(chart.totals[key])}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn--ghost btn--sm" aria-pressed={showTable} onClick={() => setShowTable((v) => !v)}>
          {showTable ? <BarChart3 size={14} aria-hidden="true" /> : <Table2 size={14} aria-hidden="true" />}
          {showTable ? t('chart.showChart') : t('chart.showTable')}
        </button>
      </div>
      <figcaption id={titleId} className="visually-hidden">
        {t('dashboard.trend.caption', { months: trend.length })}
      </figcaption>

      {showTable ? (
        <div className="trend-chart__table">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">{t('chart.month')}</th>
                {TREND_SERIES.map((key) => (
                  <th key={key} scope="col" className="num">
                    {t(SERIES_LABEL[key])}
                  </th>
                ))}
                <th scope="col" className="num">{t('chart.totalHeader')}</th>
              </tr>
            </thead>
            <tbody>
              {trend.map((point, index) => (
                <tr key={point.month}>
                  <th scope="row">{format.month(point.month, true)}</th>
                  {TREND_SERIES.map((key) => (
                    <td key={key} className="num tabular">{point[key]}</td>
                  ))}
                  <td className="num tabular">{chart.bars[index]?.total ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={containerRef} className="trend-chart__plot" onMouseLeave={() => setActive(null)}>
          <svg width={width} height={HEIGHT} role="group" aria-labelledby={titleId} className="trend-chart__svg">
            {chart.ticks.map((tick) => (
              <g key={tick} className="trend-chart__tick">
                <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(tick)} y2={y(tick)} className={tick === 0 ? 'trend-chart__baseline' : 'trend-chart__grid'} />
                <text x={MARGIN.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="trend-chart__axis-label">
                  {format.number(tick)}
                </text>
              </g>
            ))}
            {chart.bars.map((bar, index) => {
              const cx = MARGIN.left + band * index + band / 2;
              const x = cx - barWidth / 2;
              const top = bar.segments[bar.segments.length - 1];
              return (
                <g
                  key={bar.month}
                  className={`trend-chart__bar${active === index ? ' trend-chart__bar--active' : ''}${active !== null && active !== index ? ' trend-chart__bar--dim' : ''}`}
                  tabIndex={0}
                  role="img"
                  aria-label={describe(index)}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                >
                  <rect x={MARGIN.left + band * index} y={MARGIN.top} width={band} height={plotHeight} className="trend-chart__hit" />
                  {bar.segments.map((segment) => {
                    const y0 = y(segment.from);
                    const y1 = y(segment.to);
                    const isTop = segment === top;
                    const h = Math.max(0, y0 - y1 - (isTop ? 0 : 2));
                    return isTop ? (
                      <path
                        key={segment.key}
                        className={`trend-chart__segment trend-chart__segment--${segment.key}`}
                        d={roundedTop(x, y1, barWidth, h, Math.min(4, h))}
                      />
                    ) : (
                      <rect key={segment.key} className={`trend-chart__segment trend-chart__segment--${segment.key}`} x={x} y={y1 + 2} width={barWidth} height={h} />
                    );
                  })}
                  <text x={cx} y={HEIGHT - 8} textAnchor="middle" className="trend-chart__axis-label trend-chart__month">
                    {format.month(bar.month)}
                  </text>
                </g>
              );
            })}
          </svg>
          {activeBar && (
            <div className="chart-tooltip" style={{ left: tooltipLeft, top: Math.max(0, y(activeBar.total) - 8) }} aria-hidden="true">
              <p className="chart-tooltip__title">{format.month(activeBar.month, true)}</p>
              <ul>
                {TREND_SERIES.map((key) => (
                  <li key={key}>
                    <span className={`legend-swatch legend-swatch--${key}`} />
                    <span className="chart-tooltip__label">{t(SERIES_LABEL[key])}</span>
                    <span className="tabular">{trend[active ?? 0]?.[key] ?? 0}</span>
                  </li>
                ))}
              </ul>
              <p className="chart-tooltip__total">
                {t('chart.totalHeader')} <span className="tabular">{activeBar.total}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </figure>
  );
}

/** A rectangle whose top corners are rounded (the data end); the baseline end stays square. */
function roundedTop(x: number, y: number, width: number, height: number, radius: number): string {
  if (height <= 0) return '';
  const r = Math.min(radius, width / 2, height);
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`;
}
