"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRolledNumber } from "@/hooks/useRolledNumber";
import { uiStore } from "@/lib/client/uiStore";
import { sumEntries } from "@/lib/calories";
import { describePlate, mealSegments } from "@/lib/meals";
import type { FoodEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import PlateRing from "./PlateRing";

interface Props {
  entries: FoodEntry[];
  target: number;
  /** "large" for Today and Diary, "compact" for the History day sheet. */
  size?: "large" | "compact";
}

const MACROS = [
  { key: "protein", label: "Protein", kcalPerGram: 4 },
  { key: "carbs", label: "Carbs", kcalPerGram: 4 },
  { key: "fat", label: "Fat", kcalPerGram: 9 },
] as const;

/** The plate draws in once per visit (page load), not on every Today/Diary switch. */
let plateEntered = false;

/**
 * A day at a glance on the plate card: the plate ring (one arc per meal,
 * empty rim = what's left) with the remaining number inside, and where the
 * calories came from as three macro bars.
 */
export default function DaySummary({ entries, target, size = "large" }: Props) {
  const totals = sumEntries(entries);
  const consumed = Math.round(totals.calories);
  const remaining = target - consumed;
  const large = size === "large";
  const { litMeal, recent } = useSyncExternalStore(uiStore.subscribe, uiStore.getSnapshot, uiStore.getServerSnapshot);
  const pulse = entries.filter((e) => recent.includes(e.id)).map((e) => e.meal);

  // Entrance: the plate starts empty (everything remaining) and fills to the day.
  const [entering] = useState(() => large && !plateEntered);
  useEffect(() => {
    if (entering) plateEntered = true;
  }, [entering]);
  // The rolled number drives the label too, so "Remaining" flips to "Over by" as it crosses zero.
  const shown = useRolledNumber(remaining, entering ? target : remaining);
  const over = shown < 0;

  // Each macro's share of the calories it contributes (4/4/9 kcal per gram).
  const macroKcal = MACROS.map((m) => totals[m.key] * m.kcalPerGram);
  const macroTotal = macroKcal.reduce((a, b) => a + b, 0);

  return (
    <Card variant="plate" size={large ? "default" : "sm"} role="region" aria-label="Calories today">
      <CardContent className={cn("flex flex-col items-center gap-5", large && "sm:flex-row sm:gap-8")}>
        <div data-main-plate={large || undefined} className="shrink-0 rounded-full">
          <PlateRing
            segments={mealSegments(entries)}
            target={target}
            size={large ? 232 : 160}
            stroke={large ? 18 : 13}
            label={describePlate(entries, target)}
            drawIn={entering}
            lit={litMeal}
            pulse={pulse}
          >
            <p className="text-xs text-muted-foreground sm:text-sm">{over ? "Over by" : "Remaining"}</p>
            <p className={cn("type-focal", !large && "text-4xl", over ? "text-over" : "text-foreground")}>
              {Math.abs(shown).toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">of {target.toLocaleString()} kcal</p>
          </PlateRing>
        </div>

        <div className="flex w-full min-w-0 flex-1 flex-col gap-3">
          <p className="text-sm text-muted-foreground tabular-nums">
            <span className="font-heading text-xl font-semibold text-foreground">{consumed.toLocaleString()}</span>{" "}
            kcal eaten
          </p>
          {MACROS.map((m, i) => {
            const share = macroTotal > 0 ? Math.round((macroKcal[i] / macroTotal) * 100) : 0;
            return (
              <Progress key={m.key} value={share} className="gap-1.5">
                <ProgressLabel className="font-normal text-muted-foreground">{m.label}</ProgressLabel>
                <ProgressValue className="text-foreground">
                  {() => (
                    <>
                      <span className="font-semibold">{Math.round(totals[m.key])} g</span>
                      {macroTotal > 0 && <span className="text-muted-foreground"> · {share}%</span>}
                    </>
                  )}
                </ProgressValue>
              </Progress>
            );
          })}
          {macroTotal === 0 && consumed > 0 && (
            <p className="text-xs text-muted-foreground">
              Add macros to foods to see where calories came from.
            </p>
          )}
          {macroTotal > 0 && <p className="text-xs text-muted-foreground">% of calories from each.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
