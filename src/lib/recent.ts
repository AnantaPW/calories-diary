import type { FoodEntry } from "./types";

export type RecentFood = Pick<FoodEntry, "name" | "calories" | "protein" | "carbs" | "fat">;

/** Distinct foods (by name, ignoring case) newest first, with the numbers from their latest logging. */
export function recentFoods(entries: FoodEntry[], limit = 8): RecentFood[] {
  const seen = new Set<string>();
  const foods: RecentFood[] = [];
  const newestFirst = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const { name, calories, protein, carbs, fat } of newestFirst) {
    const key = name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    foods.push({ name, calories, protein, carbs, fat });
    if (foods.length === limit) break;
  }
  return foods;
}
