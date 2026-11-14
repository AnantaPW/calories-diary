"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import type { DayButtonProps } from "react-day-picker";
import { formatDayLong, fromDateKey, toDateKey, toMonthKey } from "@/lib/date";
import type { MacroTotals } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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

/** What each day button needs to draw its plate. */
const DayData = createContext<{
  today: string;
  kcalOn: (date: string) => number | undefined;
  targetFor: (date: string) => number;
}>({ today: "", kcalOn: () => undefined, targetFor: () => 0 });

/** A day of the calendar drawn as a small plate. Focus follows the keyboard. */
function PlateDay({ day, modifiers, className, ...props }: DayButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const { today, kcalOn, targetFor } = useContext(DayData);
  const date = toDateKey(day.date);
  const kcal = kcalOn(date);
  const isToday = date === today;

  return (
    <Button
      ref={ref}
      variant="ghost"
      className={cn(
        className,
        "h-12 w-full flex-col gap-1 rounded-xl border px-0 font-normal sm:h-[5.25rem]",
        // Focus moved by the arrow keys is programmatic, so mark it from DayPicker's own state.
        "group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50",
        modifiers.selected
          ? "border-primary bg-primary/10 hover:bg-primary/15"
          : isToday
            ? "border-muted-foreground"
            : "border-transparent",
      )}
      {...props}
    >
      {/* Each logged day is a small plate around its date; the wrapper picks its size by width. */}
      {[
        { size: 36, stroke: 3, className: "flex sm:hidden" },
        { size: 44, stroke: 4, className: "hidden sm:flex" },
      ].map((v) => (
        <span key={v.size} className={v.className}>
          <PlateRing
            segments={kcal ? [{ key: "day", value: kcal, color: "var(--primary)" }] : []}
            target={targetFor(date)}
            size={v.size}
            stroke={v.stroke}
          >
            <span className={cn("text-sm tabular-nums", isToday && "font-bold")}>{day.date.getDate()}</span>
          </PlateRing>
        </span>
      ))}
      {/* The number only fits from 640px; below that the plate carries it. */}
      <span className="hidden h-4 text-xs text-muted-foreground tabular-nums sm:block">
        {kcal !== undefined ? kcal.toLocaleString() : ""}
      </span>
    </Button>
  );
}

/**
 * One month on the shadcn Calendar (Monday first, future days disabled; its
 * keyboard navigation moves between days and months). Each logged day is a
 * small plate; days with nothing logged stay blank so they never read as
 * "ate nothing".
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
  const kcalOn = (date: string) => {
    const t = totals.get(date);
    return t ? Math.round(t.calories) : undefined;
  };

  return (
    <DayData.Provider value={{ today, kcalOn, targetFor }}>
    <div aria-busy={busy}>
      <Calendar
        mode="single"
        required
        weekStartsOn={1}
        showOutsideDays={false}
        hideNavigation
        month={fromDateKey(`${monthKey}-01`)}
        onMonthChange={(m) => onMonthChange(toMonthKey(toDateKey(m)))}
        endMonth={fromDateKey(today)}
        disabled={{ after: fromDateKey(today) }}
        selected={selected ? fromDateKey(selected) : undefined}
        onSelect={(d) => onSelect(toDateKey(d))}
        labels={{
          labelDayButton: (d) => {
            const date = toDateKey(d);
            return describe(date, today, kcalOn(date), targetFor(date));
          },
        }}
        className="w-full bg-transparent p-0"
        classNames={{
          root: "w-full",
          month_caption: "sr-only",
          weekday: "flex-1 pb-1 text-center text-xs font-medium text-muted-foreground",
          week: "mt-0.5 flex w-full gap-0.5 sm:mt-1 sm:gap-1",
          weekdays: "flex gap-0.5 sm:gap-1",
          day: "group/day min-w-0 flex-1 p-0",
          today: "",
          disabled: "opacity-50",
        }}
        components={{ DayButton: PlateDay }}
      />
    </div>
    </DayData.Provider>
  );
}
