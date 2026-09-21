const salaryFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export function formatSalary(value: number): string {
  return salaryFormatter.format(value);
}

export function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function compareText(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}
