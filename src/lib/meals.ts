import { sumEntries } from "./calories";
import { MEAL_TYPES, type FoodEntry, type MealType } from "./types";

/** Each meal's arc colour on the plate ring (tints of the theme colour). */
export const MEAL_COLOR: Record<MealType, string> = {
  breakfast: "var(--color-meal-1)",
  lunch: "var(--color-meal-2)",
  dinner: "var(--color-meal-3)",
  snack: "var(--color-meal-4)",
};

export interface MealGroup {
  value: MealType;
  label: string;
  entries: FoodEntry[];
  calories: number;
}

/** A day's entries grouped by meal, in meal order. */
export function groupByMeal(entries: FoodEntry[]): MealGroup[] {
  return MEAL_TYPES.map((m) => {
    const list = entries.filter((e) => e.meal === m.value);
    return { ...m, entries: list, calories: Math.round(sumEntries(list).calories) };
  });
}

/** The plate ring's arcs for a day: one per meal. */
export function mealSegments(entries: FoodEntry[]) {
  return groupByMeal(entries).map((m) => ({
    key: m.value,
    value: m.calories,
    color: MEAL_COLOR[m.value],
  }));
}

/** Screen-reader description of a day's plate. */
export function describePlate(entries: FoodEntry[], target: number): string {
  const groups = groupByMeal(entries).filter((m) => m.calories > 0);
  const total = groups.reduce((s, m) => s + m.calories, 0);
  const meals = groups.map((m) => `${m.label.toLowerCase()} ${m.calories.toLocaleString()}`);
  const head = `${total.toLocaleString()} of ${target.toLocaleString()} kcal${total > target ? ", over target" : ""}`;
  return meals.length > 0 ? `${head}: ${meals.join(", ")}` : `${head}, nothing logged`;
}
