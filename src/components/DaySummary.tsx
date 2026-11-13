import { sumEntries } from "@/lib/calories";
import { describePlate, mealSegments } from "@/lib/meals";
import type { FoodEntry } from "@/lib/types";
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

/**
 * A day at a glance, in the tinted focal card: the plate ring (one arc per
 * meal, empty rim = what's left) with the remaining number inside, and where
 * the calories came from as three macro bars.
 */
export default function DaySummary({ entries, target, size = "large" }: Props) {
  const totals = sumEntries(entries);
  const consumed = Math.round(totals.calories);
  const remaining = target - consumed;
  const over = remaining < 0;
  const large = size === "large";

  // Each macro's share of the calories it contributes (4/4/9 kcal per gram).
  const macroKcal = MACROS.map((m) => totals[m.key] * m.kcalPerGram);
  const macroTotal = macroKcal.reduce((a, b) => a + b, 0);

  return (
    <section
      className={`${large ? "card-focal" : "rounded-2xl bg-focal p-4"} flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8`}
      aria-label="Calories today"
    >
      <PlateRing
        segments={mealSegments(entries)}
        target={target}
        size={large ? 232 : 160}
        stroke={large ? 18 : 13}
        label={describePlate(entries, target)}
      >
        <p className="text-xs text-muted sm:text-sm">{over ? "Over by" : "Remaining"}</p>
        <p
          className={`focal-number ${large ? "text-[3.25rem]" : "text-[2.25rem]"} ${over ? "text-over" : "text-ink"}`}
        >
          {Math.abs(remaining).toLocaleString()}
        </p>
        <p className="num mt-1 text-xs text-muted">of {target.toLocaleString()} kcal</p>
      </PlateRing>

      <div className="w-full min-w-0 flex-1 space-y-3">
        <p className="num text-sm text-muted">
          <span className="font-display text-xl font-semibold text-ink">{consumed.toLocaleString()}</span>{" "}
          kcal eaten
        </p>
        <dl className="space-y-2.5">
          {MACROS.map((m, i) => {
            const share = macroTotal > 0 ? Math.round((macroKcal[i] / macroTotal) * 100) : 0;
            return (
              <div key={m.key}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <dt className="text-muted">{m.label}</dt>
                  <dd className="num">
                    <span className="font-semibold">{Math.round(totals[m.key])} g</span>
                    {macroTotal > 0 && <span className="text-muted"> · {share}%</span>}
                  </dd>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-sm bg-line" aria-hidden="true">
                  <div
                    className="h-full bg-brand transition-[width] duration-400 ease-out"
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            );
          })}
        </dl>
        {macroTotal === 0 && consumed > 0 && (
          <p className="text-xs text-muted">Add protein, carbs and fat to foods to see where the calories came from.</p>
        )}
        {macroTotal > 0 && (
          <p className="text-xs text-muted">Share of the calories that came from each.</p>
        )}
      </div>
    </section>
  );
}
