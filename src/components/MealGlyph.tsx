import { MEAL_COLOR } from "@/lib/meals";
import PlateRing from "./PlateRing";
import type { MealType } from "@/lib/types";
import { CupIcon, MoonIcon, SunIcon, SunriseIcon } from "./icons";

const GLYPHS = {
  breakfast: SunriseIcon,
  lunch: SunIcon,
  dinner: MoonIcon,
  snack: CupIcon,
} as const;

/**
 * The meal's time-of-day glyph, drawn in the same colour as its arc on the
 * plate ring, so the list and the ring read as one picture.
 */
export default function MealGlyph({ meal, size = 22 }: { meal: MealType; size?: number }) {
  const Icon = GLYPHS[meal];
  return (
    <span
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted"
      style={{ color: MEAL_COLOR[meal] }}
      aria-hidden="true"
    >
      <Icon width={size} height={size} />
    </span>
  );
}

/**
 * A meal glyph inside a small plate whose arc is `kcal` as a share of the
 * day's target: what the toast shows for an added or removed food.
 */
export function MealArc({ meal, kcal, target }: { meal: MealType; kcal: number; target: number }) {
  const Icon = GLYPHS[meal];
  return (
    <span className="shrink-0" style={{ color: MEAL_COLOR[meal] }} aria-hidden="true">
      <PlateRing segments={[{ key: meal, value: kcal, color: MEAL_COLOR[meal] }]} target={target} size={36} stroke={3}>
        <Icon width={16} height={16} />
      </PlateRing>
    </span>
  );
}
