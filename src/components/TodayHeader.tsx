"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useAccount } from "@/hooks/useDiary";
import { formatDateKey } from "@/lib/date";
import { dayPart, greetName } from "@/lib/greeting";
import { MEAL_TYPES, type FoodEntry } from "@/lib/types";
import { MoonIcon, SunIcon } from "./icons";

interface Props {
  /** Today's date key, null until the visitor's clock is known. */
  today: string | null;
  /** Today's entries, or undefined while the diary loads. */
  entries?: FoodEntry[];
}

/** The sun rises once per visit (page load), not on every Today/Diary switch. */
let sunRisen = false;

/**
 * The sky over the table: a dotted arc with the sun (or moon) where the clock
 * is now, a greeting for the part of the day, and which meal comes next.
 */
export default function TodayHeader({ today, entries }: Props) {
  const { username } = useAccount();
  const [rise] = useState(() => !sunRisen);
  useEffect(() => {
    if (today) sunRisen = true;
  }, [today]);

  // shortcut: the hour is read on render, so a page left open across a window boundary updates on the next render.
  const part = today ? dayPart(new Date()) : null;
  const name = greetName(username);
  const mealLabel = part?.meal && MEAL_TYPES.find((m) => m.value === part.meal)?.label;
  const mealLine = !part || !entries
    ? null
    : !part.meal
      ? "Snacks count toward today"
      : entries.some((e) => e.meal === part.meal)
        ? `${mealLabel} logged`
        : `${mealLabel} is next`;
  const Glyph = part?.night ? MoonIcon : SunIcon;

  return (
    <header className="flex flex-col gap-3">
      <div aria-hidden="true" className="relative h-12 border-b border-border">
        <div className="sky absolute inset-x-3 inset-y-0">
          <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 48" preserveAspectRatio="none">
            {/* Same curve the glyph follows in CSS: y = 48 - 136·t·(1-t). */}
            <path
              d="M0 48 Q50 -20 100 48"
              fill="none"
              stroke="var(--muted-foreground)"
              strokeOpacity="0.45"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="0.01 7"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {part && (
            <span
              className="sky-glyph absolute bottom-0 left-0 text-primary"
              data-rise={rise || undefined}
              style={{ "--t": part.t } as CSSProperties}
            >
              <Glyph />
            </span>
          )}
        </div>
      </div>
      <div className="min-w-0">
        <h1 className="type-title [overflow-wrap:anywhere]">
          {part ? `${part.greeting}${name ? `, ${name}` : ""}` : "Today"}
        </h1>
        {/* Both lines keep their height so the header doesn't jump once the date and diary are known. */}
        <p className="min-h-5 text-sm text-muted-foreground">{today && formatDateKey(today)}</p>
        <p className="min-h-5 text-sm text-muted-foreground">{mealLine}</p>
      </div>
    </header>
  );
}
