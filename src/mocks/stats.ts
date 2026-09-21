import type { StatsOverview, TrendPoint } from '../api/types';
import { COMPANY_VALUES } from '../api/types';
import type { StoredEmployee, StoredFeedback } from './seed';

const DAY = 86_400_000;

const monthKey = (date: Date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

function positiveShare(items: StoredFeedback[]): { share: number; analysed: number } {
  const analysed = items.filter((f) => f.sentiment);
  const positive = analysed.filter((f) => f.sentiment?.label === 'POSITIVE').length;
  return { share: analysed.length ? positive / analysed.length : 0, analysed: analysed.length };
}

const round = (value: number) => Math.round(value * 100) / 100;

/** GET /stats/overview, computed exactly as the contract describes. */
export function computeOverview(
  employees: StoredEmployee[],
  feedback: StoredFeedback[],
  now: Date,
  months = 6,
): StatsOverview {
  const time = (f: StoredFeedback) => new Date(f.createdAt).getTime();
  const nameOf = new Map(employees.map((e) => [e.id, e]));

  const departments = [...employees.reduce((map, e) => map.set(e.department, (map.get(e.department) ?? 0) + 1), new Map<string, number>())]
    .map(([name, headcount]) => ({ name, headcount }))
    .sort((a, b) => b.headcount - a.headcount || a.name.localeCompare(b.name));

  const thisMonthKey = monthKey(now);
  const lastMonthKey = monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));

  const count = (label: string | null) =>
    feedback.filter((f) => (label === null ? !f.sentiment : f.sentiment?.label === label)).length;
  const total = feedback.length;
  const share = (n: number) => (total ? round(n / total) : 0);

  const trend: TrendPoint[] = [];
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const month = monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1)));
    const inMonth = feedback.filter((f) => monthKey(new Date(f.createdAt)) === month);
    trend.push({
      month,
      positive: inMonth.filter((f) => f.sentiment?.label === 'POSITIVE').length,
      neutral: inMonth.filter((f) => f.sentiment?.label === 'NEUTRAL').length,
      negative: inMonth.filter((f) => f.sentiment?.label === 'NEGATIVE').length,
      notAnalysed: inMonth.filter((f) => !f.sentiment).length,
    });
  }

  const recent = feedback.filter((f) => time(f) >= now.getTime() - 90 * DAY);
  const topRecognised = [...recent.reduce((map, f) => map.set(f.recipientId, [...(map.get(f.recipientId) ?? []), f]), new Map<string, StoredFeedback[]>())]
    .flatMap(([employeeId, items]) => {
      const employee = nameOf.get(employeeId);
      return employee
        ? [{ employeeId, name: employee.name, department: employee.department, count: items.length, positiveShare: round(positiveShare(items).share) }]
        : [];
    })
    .sort((a, b) => b.count - a.count || b.positiveShare - a.positiveShare || a.name.localeCompare(b.name))
    .slice(0, 5);

  const alerts = employees.flatMap((employee) => {
    const about = feedback.filter((f) => f.recipientId === employee.id);
    const currentWindow = about.filter((f) => time(f) > now.getTime() - 30 * DAY && time(f) <= now.getTime());
    const previousWindow = about.filter((f) => time(f) > now.getTime() - 60 * DAY && time(f) <= now.getTime() - 30 * DAY);
    const current = positiveShare(currentWindow);
    const previous = positiveShare(previousWindow);
    if (current.analysed < 3 || previous.analysed < 3 || previous.share - current.share < 0.25) return [];
    return [{
      employeeId: employee.id,
      name: employee.name,
      department: employee.department,
      previousPositiveShare: round(previous.share),
      currentPositiveShare: round(current.share),
      feedbackCount: currentWindow.length,
    }];
  });

  return {
    headcount: employees.length,
    departments,
    feedback: {
      thisMonth: feedback.filter((f) => monthKey(new Date(f.createdAt)) === thisMonthKey).length,
      lastMonth: feedback.filter((f) => monthKey(new Date(f.createdAt)) === lastMonthKey).length,
      total,
    },
    sentimentShare: {
      positive: share(count('POSITIVE')),
      neutral: share(count('NEUTRAL')),
      negative: share(count('NEGATIVE')),
      notAnalysed: share(count(null)),
    },
    trend,
    valueCounts: COMPANY_VALUES.map((value) => ({ value, count: feedback.filter((f) => f.value === value).length })).sort(
      (a, b) => b.count - a.count,
    ),
    topRecognised,
    alerts,
  };
}
