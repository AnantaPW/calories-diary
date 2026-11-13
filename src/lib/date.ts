/** Returns a local-time YYYY-MM-DD string (avoids UTC shifting from toISOString). */
export function toDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function shiftDateKey(key: string, days: number): string {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function formatDateKey(key: string): string {
  return fromDateKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** True for a real calendar date written as YYYY-MM-DD. */
export function isDateKey(value: string | null | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && toDateKey(fromDateKey(value)) === value;
}

/** e.g. "Thursday, 12 November" */
export function formatDayLong(key: string): string {
  return fromDateKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** e.g. "12 November" */
export function formatDayShort(key: string): string {
  return fromDateKey(key).toLocaleDateString(undefined, { day: "numeric", month: "long" });
}

// Months are handled as "YYYY-MM" keys.

export function toMonthKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

export function shiftMonthKey(monthKey: string, months: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  return toDateKey(new Date(y, m - 1 + months, 1)).slice(0, 7);
}

export function daysInMonth(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** e.g. "November 2026" */
export function formatMonthKey(monthKey: string): string {
  return fromDateKey(`${monthKey}-01`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/** e.g. "November" */
export function formatMonthName(monthKey: string): string {
  return fromDateKey(`${monthKey}-01`).toLocaleDateString(undefined, { month: "long" });
}

/**
 * The month as rows of 7 cells, weeks starting on Monday.
 * Cells outside the month are null.
 */
export function monthMatrix(monthKey: string): (string | null)[][] {
  const first = fromDateKey(`${monthKey}-01`);
  const lead = (first.getDay() + 6) % 7; // Monday = 0
  const total = daysInMonth(monthKey);
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= total; d++) {
    cells.push(`${monthKey}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Monday-first weekday names, e.g. { short: "Mon", long: "Monday" }. */
export function weekdayNames(): { short: string; long: string }[] {
  // 2024-01-01 was a Monday.
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 1 + i);
    return {
      short: d.toLocaleDateString(undefined, { weekday: "short" }),
      long: d.toLocaleDateString(undefined, { weekday: "long" }),
    };
  });
}
