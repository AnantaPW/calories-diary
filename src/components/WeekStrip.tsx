"use client";

import { useRef } from "react";
import { formatDayLong, fromDateKey, isDateKey, shiftDateKey } from "@/lib/date";
import type { MacroTotals } from "@/lib/types";
import PlateRing from "./PlateRing";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";

interface Props {
  date: string;
  today: string;
  totals: Map<string, MacroTotals>;
  targetFor: (date: string) => number;
  onSelect: (date: string) => void;
}

/** Monday of the week containing `date`. */
function weekStart(date: string) {
  const weekday = (fromDateKey(date).getDay() + 6) % 7;
  return shiftDateKey(date, -weekday);
}

/**
 * The Diary's day picker: one week of days, each with a tiny plate showing
 * how full it was. Arrows move a week; the calendar button opens the
 * native date picker for days further away.
 */
export default function WeekStrip({ date, today, totals, targetFor, onSelect }: Props) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const start = weekStart(date);
  const days = Array.from({ length: 7 }, (_, i) => shiftDateKey(start, i));
  const nextWeek = shiftDateKey(start, 7);

  const first = fromDateKey(start);
  const last = fromDateKey(days[6]);
  const weekLabel = `${first.toLocaleDateString(undefined, { day: "numeric", month: "short" })} to ${last.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;

  return (
    <div className="space-y-2">
      {/* Controls on their own row, so the seven days get the full width on small phones. */}
      <div className="flex items-center gap-2">
        <p className="num min-w-0 flex-1 text-sm text-muted">{weekLabel}</p>
        <button
          type="button"
          className="btn-icon"
          aria-label="Previous week"
          onClick={() => onSelect(shiftDateKey(date, -7))}
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          className="btn-icon"
          aria-label="Next week"
          disabled={nextWeek > today}
          onClick={() => onSelect(shiftDateKey(date, 7) > today ? today : shiftDateKey(date, 7))}
        >
          <ChevronRightIcon />
        </button>
        <div className="relative">
          <button
            type="button"
            className="btn-icon"
            aria-label="Pick a date"
            onClick={() => {
              const input = pickerRef.current;
              if (!input) return;
              if (typeof input.showPicker === "function") input.showPicker();
              else input.focus();
            }}
          >
            <CalendarIcon />
          </button>
          {/* The native picker, opened by the button above. */}
          <input
            ref={pickerRef}
            type="date"
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0"
            max={today}
            value={date}
            onChange={(e) => isDateKey(e.target.value) && onSelect(e.target.value)}
          />
        </div>
      </div>

      <ol className="grid grid-cols-7 gap-0.5 sm:gap-2" aria-label="Days this week">
        {days.map((d) => {
          const kcal = totals.get(d)?.calories;
          const selected = d === date;
          const future = d > today;
          const target = targetFor(d);
          const day = fromDateKey(d);
          return (
            <li key={d} className="min-w-0">
              <button
                type="button"
                disabled={future}
                aria-pressed={selected}
                aria-current={d === today ? "date" : undefined}
                aria-label={`${d === today ? "Today, " : ""}${formatDayLong(d)}${
                  kcal !== undefined ? `, ${Math.round(kcal).toLocaleString()} of ${target.toLocaleString()} kcal` : ", nothing logged"
                }`}
                onClick={() => onSelect(d)}
                className={`flex w-full flex-col items-center gap-1 rounded-xl border py-2 ${
                  selected ? "border-brand bg-focal" : "border-transparent hover:bg-surface"
                } ${future ? "opacity-40" : "active:translate-y-px"}`}
              >
                <span className={`text-[11px] ${selected ? "font-semibold text-ink" : "text-muted"}`}>
                  {day.toLocaleDateString(undefined, { weekday: "narrow" })}
                </span>
                <PlateRing
                  segments={kcal ? [{ key: "day", value: kcal, color: "var(--color-brand)" }] : []}
                  target={target}
                  size={34}
                  stroke={3}
                >
                  <span className={`num text-xs ${d === today ? "font-bold" : ""}`}>{day.getDate()}</span>
                </PlateRing>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
