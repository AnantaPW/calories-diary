import { MEAL_COLOR } from "@/lib/meals";
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
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-2"
      style={{ color: MEAL_COLOR[meal] }}
      aria-hidden="true"
    >
      <Icon width={size} height={size} />
    </span>
  );
}
