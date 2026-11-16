// A financial year is identified by the calendar year it ENDS in.
// With fyStartMonth = 7 (July), FY2026 runs 1 Jul 2025 - 30 Jun 2026.
// With fyStartMonth = 1 (January), FY2026 runs 1 Jan 2026 - 31 Dec 2026.

export function fyForDate(date: Date, fyStartMonth: number): number {
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();
  return month >= fyStartMonth ? year + 1 : year;
}

export function fyRange(fy: number, fyStartMonth: number): { start: Date; end: Date } {
  const startYear = fyStartMonth === 1 ? fy : fy - 1;
  const start = new Date(startYear, fyStartMonth - 1, 1);
  const end = new Date(startYear + 1, fyStartMonth - 1, 1);
  return { start, end };
}

export function fyLabel(fy: number, fyStartMonth: number): string {
  if (fyStartMonth === 1) return `FY${fy}`;
  const startYear = fy - 1;
  return `FY${startYear}–${String(fy).slice(-2)}`;
}

export function currentFy(fyStartMonth: number): number {
  return fyForDate(new Date(), fyStartMonth);
}
