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
