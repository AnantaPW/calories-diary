"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  daysInMonth,
  formatDayLong,
  fromDateKey,
  monthMatrix,
  shiftDateKey,
  shiftMonthKey,
  toMonthKey,
  weekdayNames,
} from "@/lib/date";
import type { MacroTotals } from "@/lib/types";
import PlateRing from "./PlateRing";

interface Props {
  monthKey: string;
  today: string;
  totals: Map<string, MacroTotals>;
  targetFor: (date: string) => number;
  selected: string | null;
  onSelect: (date: string) => void;
  onMonthChange: (monthKey: string) => void;
  /** True while saved entries are still being read. */
  busy?: boolean;
}

function describe(date: string, today: string, kcal: number | undefined, target: number) {
  const parts = [date === today ? `Today, ${formatDayLong(date)}` : formatDayLong(date)];
  if (kcal === undefined) parts.push("nothing logged");
  else {
    parts.push(`${kcal.toLocaleString()} of ${target.toLocaleString()} kcal`);
    parts.push(kcal > target ? "over target" : "within target");
  }
  return parts.join(", ");
}

/**
 * One month as a keyboard-navigable grid. Each logged day carries the fill
 * line; days with nothing logged stay blank so they never read as "ate nothing".
 */
export default function CalendarMonth({
  monthKey,
  today,
  totals,
  targetFor,
  selected,
  onSelect,
  onMonthChange,
  busy = false,
}: Props) {
  const weeks = useMemo(() => monthMatrix(monthKey), [monthKey]);
  const weekdays = useMemo(() => weekdayNames(), []);
  const gridRef = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);
  const [focusDate, setFocusDate] = useState<string | null>(null);

  // Exactly one day is in the Tab order; arrow keys move between days.
  const inMonth = (d: string | null): d is string => !!d && toMonthKey(d) === monthKey;
  const tabbable = inMonth(focusDate)
    ? focusDate
    : inMonth(selected)
      ? selected
      : inMonth(today)
        ? today
        : `${monthKey}-01`;

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${tabbable}"]`)?.focus();
  }, [tabbable]);

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const from = (e.target as HTMLElement).dataset?.date;
    if (!from) return;

    const sameDayInMonth = (months: number) => {
      const target = shiftMonthKey(toMonthKey(from), months);
      const day = Math.min(fromDateKey(from).getDate(), daysInMonth(target));
      return `${target}-${String(day).padStart(2, "0")}`;
    };
    const weekday = (fromDateKey(from).getDay() + 6) % 7; // Monday = 0

    let next: string | undefined;
    switch (e.key) {
      case "ArrowLeft": next = shiftDateKey(from, -1); break;
      case "ArrowRight": next = shiftDateKey(from, 1); break;
      case "ArrowUp": next = shiftDateKey(from, -7); break;
      case "ArrowDown": next = shiftDateKey(from, 7); break;
      case "Home": next = shiftDateKey(from, -weekday); break;
      case "End": next = shiftDateKey(from, 6 - weekday); break;
      case "PageUp": next = sameDayInMonth(-1); break;
      case "PageDown": next = sameDayInMonth(1); break;
    }
    if (!next) return;
    e.preventDefault();
    if (next > today) next = today; // future days cannot be opened
    if (next === from) return;

    moveFocus.current = true;
    setFocusDate(next);
    if (toMonthKey(next) !== monthKey) onMonthChange(toMonthKey(next));
  }

  return (
    <div
      ref={gridRef}
      role="grid"
      aria-label="Days of the month"
      aria-busy={busy}
      onKeyDown={handleKeyDown}
      className="select-none"
    >
      <div role="row" className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {weekdays.map((w) => (
          <div
            key={w.long}
            role="columnheader"
            aria-label={w.long}
            className="pb-1 text-center text-xs font-medium text-muted sm:px-2 sm:text-left"
          >
            {w.short}
          </div>
        ))}
      </div>

      {weeks.map((week, i) => (
        <div key={i} role="row" className="mt-0.5 grid grid-cols-7 gap-0.5 sm:mt-1 sm:gap-1">
          {week.map((date, j) => {
            if (!date) return <div key={j} role="gridcell" />;

            const dayTotals = totals.get(date);
            const kcal = dayTotals ? Math.round(dayTotals.calories) : undefined;
            const target = targetFor(date);
            const isToday = date === today;
            const isSelected = date === selected;
            const future = date > today;

            return (
              <div key={j} role="gridcell" className="min-w-0">
                <button
                  type="button"
                  data-date={date}
                  tabIndex={date === tabbable ? 0 : -1}
                  disabled={future}
                  aria-label={describe(date, today, kcal, target)}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  onClick={() => {
                    setFocusDate(date);
                    onSelect(date);
                  }}
                  className={`flex h-12 w-full flex-col items-center justify-center gap-1 rounded-xl border sm:h-[5.25rem] ${
                    isSelected
                      ? "border-brand bg-focal"
                      : isToday
                        ? "border-muted"
                        : "border-transparent"
                  } ${future ? "text-muted opacity-50" : "hover:bg-surface-2 active:translate-y-px"}`}
                >
                  {/* Each logged day is a small plate around its date. */}
                  {[
                    { size: 36, stroke: 3, className: "flex sm:hidden" },
                    { size: 44, stroke: 4, className: "hidden sm:flex" },
                  ].map((v) => (
                    // The wrapper switches size by width; the plate itself keeps its own layout.
                    <span key={v.size} className={v.className}>
                      <PlateRing
                        segments={kcal ? [{ key: "day", value: kcal, color: "var(--color-brand)" }] : []}
                        target={target}
                        size={v.size}
                        stroke={v.stroke}
                      >
                        <span className={`num text-sm ${isToday ? "font-bold" : ""}`}>
                          {fromDateKey(date).getDate()}
                        </span>
                      </PlateRing>
                    </span>
                  ))}
                  {/* The number only fits from 640px; below that the plate carries it. */}
                  <span className="num hidden h-4 text-xs text-muted sm:block">
                    {kcal !== undefined ? kcal.toLocaleString() : ""}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
