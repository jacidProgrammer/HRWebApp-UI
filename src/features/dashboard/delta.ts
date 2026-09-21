/** Month-over-month change of the feedback count, for the KPI delta chip. */
export function monthOverMonth(thisMonth: number, lastMonth: number): { direction: 'up' | 'down' | 'flat' | 'new'; change: number } {
  if (lastMonth === 0) return { direction: thisMonth > 0 ? 'new' : 'flat', change: 0 };
  const change = (thisMonth - lastMonth) / lastMonth;
  return { direction: change > 0.005 ? 'up' : change < -0.005 ? 'down' : 'flat', change };
}
