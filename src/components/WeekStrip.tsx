"use client";

import { useRef } from "react";
import { formatDayLong, fromDateKey, isDateKey, shiftDateKey } from "@/lib/date";
import type { MacroTotals } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
    <div className="flex flex-col gap-2 lg:max-w-2xl">
      {/* Controls on their own row, so the seven days get the full width on small phones. */}
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 text-sm text-muted-foreground tabular-nums">{weekLabel}</p>
        <Button variant="outline" size="icon" aria-label="Previous week" onClick={() => onSelect(shiftDateKey(date, -7))}>
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next week"
          disabled={nextWeek > today}
          onClick={() => onSelect(shiftDateKey(date, 7) > today ? today : shiftDateKey(date, 7))}
        >
          <ChevronRightIcon />
        </Button>
        {/*
          overflow-hidden: phone browsers (Safari on iPhone in particular) give
          native date inputs their own width and ignore the box, which pushed
          this page wider than the screen and made the browser zoom the whole
          Diary out. The input is invisible, so clipping it hides nothing.
        */}
        <div className="relative size-11 shrink-0 overflow-hidden rounded-lg">
          <Button
            variant="outline"
            size="icon"
            aria-label="Pick a date"
            onClick={() => {
              const input = pickerRef.current;
              if (!input) return;
              if (typeof input.showPicker === "function") input.showPicker();
              else input.focus();
            }}
          >
            <CalendarIcon />
          </Button>
          {/* The native picker, opened by the button above. */}
          <input
            ref={pickerRef}
            type="date"
            tabIndex={-1}
            aria-hidden="true"
            // Fixed to the button's size; 16px text so iPhones don't zoom in when the picker opens.
            className="pointer-events-none absolute left-0 top-0 h-11 w-11 min-w-0 max-w-11 appearance-none text-base opacity-0"
            max={today}
            value={date}
            onChange={(e) => isDateKey(e.target.value) && onSelect(e.target.value)}
          />
        </div>
      </div>

      <ToggleGroup
        aria-label="Days this week"
        spacing={1}
        className="grid w-full grid-cols-7 sm:gap-2 lg:max-w-2xl"
        value={[date]}
        onValueChange={(value) => value[0] && onSelect(value[0])}
      >
        {days.map((d) => {
          const kcal = totals.get(d)?.calories;
          const selected = d === date;
          const target = targetFor(d);
          const day = fromDateKey(d);
          return (
            <ToggleGroupItem
              key={d}
              value={d}
              variant="outline"
              disabled={d > today}
              aria-current={d === today ? "date" : undefined}
              aria-label={`${d === today ? "Today, " : ""}${formatDayLong(d)}${
                kcal !== undefined ? `, ${Math.round(kcal).toLocaleString()} of ${target.toLocaleString()} kcal` : ", nothing logged"
              }`}
              className="h-auto min-w-0 flex-col gap-1 rounded-xl border-transparent px-0 py-2"
            >
              <span className={cn("text-[11px]", selected ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {day.toLocaleDateString(undefined, { weekday: "narrow" })}
              </span>
              {/* Marked so the Diary can morph this plate into the big one when the day opens. */}
              <span data-day-plate={d} className="inline-flex rounded-full">
                <PlateRing
                  segments={kcal ? [{ key: "day", value: kcal, color: "var(--primary)" }] : []}
                  target={target}
                  size={34}
                  stroke={3}
                >
                  <span className={cn("text-xs tabular-nums", d === today && "font-bold")}>{day.getDate()}</span>
                </PlateRing>
              </span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
}
