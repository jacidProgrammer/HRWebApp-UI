import { ArrowDownRight, ArrowUpRight, Building2, CheckCircle2, MessageSquareHeart, Minus, ShieldCheck, Smile, TrendingDown, UsersRound, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStatsOverview } from '../../api/hooks';
import type { StatsOverview } from '../../api/types';
import { SentimentTrendChart } from '../../components/charts/SentimentTrendChart';
import { usePageTitle } from '../../components/shell/pageTitle';
import { ErrorState } from '../../components/ui/Alert';
import { Avatar } from '../../components/ui/Avatar';
import { DepartmentChip } from '../../components/ui/Chips';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingRegion, Skeleton } from '../../components/ui/Skeleton';
import { useI18n } from '../../i18n/context';
import { departmentColorIndex } from '../../lib/colors';
import { useFormat } from '../../lib/format';
import { VALUE_META } from '../../lib/values';
import { monthOverMonth } from './delta';
import './DashboardPage.css';

const RANGES = [3, 6, 12] as const;

function Kpi({ icon: Icon, label, value, tone, children }: { icon: LucideIcon; label: string; value: ReactNode; tone: string; children?: ReactNode }) {
  return (
    <li className="kpi card">
      <div className="kpi__head">
        <span className="kpi__label">{label}</span>
        <span className={`kpi__icon kpi__icon--${tone}`} aria-hidden="true">
          <Icon size={18} />
        </span>
      </div>
      <p className="kpi__value tabular">{value}</p>
      <div className="kpi__foot">{children}</div>
    </li>
  );
}

function KpiRow({ stats }: { stats: StatsOverview }) {
  const { t, tp } = useI18n();
  const format = useFormat();
  const delta = monthOverMonth(stats.feedback.thisMonth, stats.feedback.lastMonth);
  const DeltaIcon = delta.direction === 'up' ? ArrowUpRight : delta.direction === 'down' ? ArrowDownRight : Minus;
  const largest = stats.departments[0];

  return (
    <ul className="kpis" aria-label={t('dashboard.kpis')}>
      <Kpi icon={UsersRound} tone="blue" label={t('dashboard.kpi.headcount')} value={format.number(stats.headcount)}>
        <span className="kpi__sub">{tp('dashboard.kpi.headcountSub', stats.departments.length)}</span>
      </Kpi>
      <Kpi icon={MessageSquareHeart} tone="violet" label={t('dashboard.kpi.thisMonth')} value={format.number(stats.feedback.thisMonth)}>
        <span className={`delta delta--${delta.direction}`}>
          <DeltaIcon size={14} aria-hidden="true" />
          {delta.direction === 'new'
            ? t('dashboard.kpi.new')
            : delta.direction === 'flat'
              ? t('dashboard.kpi.flat')
              : format.percent(Math.abs(delta.change))}
        </span>
        <span className="kpi__sub">{t('dashboard.kpi.vsLastMonth', { count: format.number(stats.feedback.lastMonth) })}</span>
      </Kpi>
      <Kpi icon={Smile} tone="teal" label={t('dashboard.kpi.positive')} value={format.percent(stats.sentimentShare.positive)}>
        <span className="share-bar" aria-hidden="true">
          <span className="share-bar__fill" style={{ width: `${Math.round(stats.sentimentShare.positive * 100)}%` }} />
        </span>
        <span className="kpi__sub">{t('dashboard.kpi.positiveSub', { count: format.number(stats.feedback.total) })}</span>
      </Kpi>
      <Kpi icon={Building2} tone="amber" label={t('dashboard.kpi.departments')} value={format.number(stats.departments.length)}>
        <span className="dept-bar" aria-hidden="true">
          {stats.departments.map((d) => (
            <span key={d.name} className={`dept-bar__part chip--d${departmentColorIndex(d.name)}`} style={{ flexGrow: d.headcount }} />
          ))}
        </span>
        {largest && <span className="kpi__sub">{t('dashboard.kpi.largest', { name: largest.name, count: largest.headcount })}</span>}
      </Kpi>
    </ul>
  );
}

function AlertsPanel({ stats }: { stats: StatsOverview }) {
  const { t, tp } = useI18n();
  const format = useFormat();
  return (
    <section className="card dashboard__alerts" aria-labelledby="alerts-heading">
      <div className="card__header">
        <div>
          <h2 id="alerts-heading" className="card__title">
            {t('dashboard.alerts.title')}
          </h2>
          <p className="card__subtitle">{t('dashboard.alerts.subtitle')}</p>
        </div>
        {stats.alerts.length > 0 && <span className="badge badge--danger">{stats.alerts.length}</span>}
      </div>
      <div className="card__body">
        {stats.alerts.length === 0 ? (
          <EmptyState icon={CheckCircle2} tone="neutral" compact headingLevel={3} title={t('dashboard.alerts.none.title')}>
            {t('dashboard.alerts.none.body')}
          </EmptyState>
        ) : (
          <ul className="alert-list">
            {stats.alerts.map((alert) => (
              <li key={alert.employeeId} className="alert-item">
                <span className="alert-item__icon" aria-hidden="true">
                  <TrendingDown size={18} />
                </span>
                <div className="alert-item__text">
                  <p className="alert-item__message">
                    {t('dashboard.alerts.dropBefore')}
                    <Link to={`/people/${alert.employeeId}`} className="alert-item__link">
                      {alert.name}
                    </Link>
                    {t('dashboard.alerts.dropAfter', {
                      from: format.percent(alert.previousPositiveShare),
                      to: format.percent(alert.currentPositiveShare),
                    })}
                  </p>
                  <p className="alert-item__meta">
                    <DepartmentChip department={alert.department} />
                    <span>{tp('dashboard.alerts.count', alert.feedbackCount)}</span>
                  </p>
                  <dl className="alert-item__compare">
                    <div>
                      <dt>{t('dashboard.alerts.before')}</dt>
                      <dd>
                        <span className="alert-item__bar" aria-hidden="true">
                          <span style={{ width: `${alert.previousPositiveShare * 100}%` }} />
                        </span>
                        <span className="tabular">{format.percent(alert.previousPositiveShare)}</span>
                      </dd>
                    </div>
                    <div>
                      <dt>{t('dashboard.alerts.now')}</dt>
                      <dd>
                        <span className="alert-item__bar alert-item__bar--now" aria-hidden="true">
                          <span style={{ width: `${alert.currentPositiveShare * 100}%` }} />
                        </span>
                        <span className="tabular">{format.percent(alert.currentPositiveShare)}</span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="dashboard__privacy">
        <ShieldCheck size={14} aria-hidden="true" />
        {t('dashboard.alerts.privacy')}
      </p>
    </section>
  );
}

function ValueDistribution({ stats }: { stats: StatsOverview }) {
  const { t } = useI18n();
  const format = useFormat();
  const max = Math.max(1, ...stats.valueCounts.map((v) => v.count));
  const total = stats.valueCounts.reduce((sum, v) => sum + v.count, 0);
  return (
    <section className="card" aria-labelledby="values-heading">
      <div className="card__header">
        <div>
          <h2 id="values-heading" className="card__title">
            {t('dashboard.values.title')}
          </h2>
          <p className="card__subtitle">{t('dashboard.values.subtitle')}</p>
        </div>
      </div>
      <ul className="card__body value-bars">
        {stats.valueCounts.map(({ value, count }) => {
          const { icon: Icon, label } = VALUE_META[value];
          return (
            <li key={value} className={`value-bar value-bar--${value.toLowerCase()}`}>
              <span className="value-bar__label">
                <span className="value-bar__icon" aria-hidden="true">
                  <Icon size={14} />
                </span>
                {t(label)}
              </span>
              <span className="value-bar__track" aria-hidden="true">
                <span className="value-bar__fill" style={{ width: `${(count / max) * 100}%` }} />
              </span>
              <span className="value-bar__count tabular">
                {format.number(count)}
                <span className="value-bar__share">{total ? format.percent(count / total) : ''}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function TopRecognised({ stats }: { stats: StatsOverview }) {
  const { t, tp } = useI18n();
  const format = useFormat();
  return (
    <section className="card" aria-labelledby="top-heading">
      <div className="card__header">
        <div>
          <h2 id="top-heading" className="card__title">
            {t('dashboard.top.title')}
          </h2>
          <p className="card__subtitle">{t('dashboard.top.subtitle')}</p>
        </div>
      </div>
      {stats.topRecognised.length === 0 ? (
        <EmptyState icon={UsersRound} tone="neutral" compact headingLevel={3} title={t('dashboard.top.none')} />
      ) : (
        <ol className="top-list">
          {stats.topRecognised.map((person, index) => (
            <li key={person.employeeId} className="top-list__item">
              <span className="top-list__rank tabular" aria-hidden="true">{index + 1}</span>
              <Avatar name={person.name} size="md" />
              <div className="top-list__who">
                <Link to={`/people/${person.employeeId}`} className="top-list__name">
                  {person.name}
                </Link>
                <span className="top-list__meta">{person.department}</span>
              </div>
              <div className="top-list__stats">
                <span className="top-list__count tabular">{tp('dashboard.top.count', person.count)}</span>
                <span className="top-list__positive">
                  <span className="share-bar share-bar--sm" aria-hidden="true">
                    <span className="share-bar__fill" style={{ width: `${person.positiveShare * 100}%` }} />
                  </span>
                  <span className="tabular">{t('dashboard.top.positive', { value: format.percent(person.positiveShare) })}</span>
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <LoadingRegion>
      <div className="dashboard">
        <div className="kpis">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} height={132} radius={12} />
          ))}
        </div>
        <div className="dashboard__row dashboard__row--wide">
          <Skeleton height={360} radius={12} />
          <Skeleton height={360} radius={12} />
        </div>
      </div>
    </LoadingRegion>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();
  usePageTitle(t('dashboard.title'));
  const [params, setParams] = useSearchParams();
  const requested = Number(params.get('months'));
  const months = (RANGES as readonly number[]).includes(requested) ? requested : 6;
  const stats = useStatsOverview(months);

  return (
    <div className="page">
      <div className="page-intro">
        <p className="page-intro__text">{t('dashboard.intro')}</p>
        <div className="segmented" role="group" aria-label={t('dashboard.range')}>
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              aria-pressed={months === range}
              className="segmented__option"
              onClick={() => setParams(range === 6 ? {} : { months: String(range) }, { replace: true })}
            >
              {t('dashboard.months', { count: range })}
            </button>
          ))}
        </div>
      </div>

      {stats.isPending ? (
        <DashboardSkeleton />
      ) : stats.isError ? (
        <ErrorState error={stats.error} onRetry={() => void stats.refetch()} />
      ) : (
        <div className="dashboard">
          <KpiRow stats={stats.data} />
          <div className="dashboard__row dashboard__row--wide">
            <section className="card" aria-labelledby="trend-heading">
              <div className="card__header">
                <div>
                  <h2 id="trend-heading" className="card__title">
                    {t('dashboard.trend.title')}
                  </h2>
                  <p className="card__subtitle">{t('dashboard.trend.subtitle', { count: months })}</p>
                </div>
              </div>
              <div className="card__body">
                <SentimentTrendChart trend={stats.data.trend} />
              </div>
            </section>
            <AlertsPanel stats={stats.data} />
          </div>
          <div className="dashboard__row">
            <ValueDistribution stats={stats.data} />
            <TopRecognised stats={stats.data} />
          </div>
        </div>
      )}
    </div>
  );
}
