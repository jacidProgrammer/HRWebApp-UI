import type { CompanyValue, Feedback } from '../../api/types';

/** The company value someone is most often recognised for, or null. */
export function topValue(items: Feedback[]): CompanyValue | null {
  const counts = new Map<CompanyValue, number>();
  for (const item of items) if (item.value) counts.set(item.value, (counts.get(item.value) ?? 0) + 1);
  let best: CompanyValue | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}
