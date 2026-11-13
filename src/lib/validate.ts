/*
 * Checks for data sent to the server. Anything that fails is rejected before
 * it reaches a data file.
 */
import { isDateKey } from "./date";
import { MEAL_TYPES, type FoodEntry, type TargetChange, type UserProfile } from "./types";

export const MAX_ENTRIES_PER_DAY = 200;
export const MAX_ENTRIES_TOTAL = 50000;
export const FOOD_NAME_MAX = 80;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const inRange = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;

const optionalGrams = (v: unknown) => v === undefined || v === null || inRange(v, 0, 1000);

const ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

export function isEntryId(value: unknown): value is string {
  return typeof value === "string" && ID_PATTERN.test(value);
}

/** A cleaned-up entry, or null when the input isn't a valid food entry. */
export function parseEntry(input: unknown): FoodEntry | null {
  if (!isRecord(input)) return null;
  const { id, date, meal, name, calories, protein, carbs, fat, createdAt } = input;
  if (!isEntryId(id) || typeof date !== "string" || !isDateKey(date)) return null;
  if (!MEAL_TYPES.some((m) => m.value === meal)) return null;
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > FOOD_NAME_MAX) return null;
  if (!inRange(calories, 0, 10000)) return null;
  if (!optionalGrams(protein) || !optionalGrams(carbs) || !optionalGrams(fat)) return null;
  const created =
    typeof createdAt === "string" && !Number.isNaN(Date.parse(createdAt))
      ? new Date(createdAt).toISOString()
      : new Date().toISOString();

  const entry: FoodEntry = {
    id,
    date,
    meal: meal as FoodEntry["meal"],
    name: trimmed,
    calories: Math.round(calories * 10) / 10,
    createdAt: created,
  };
  if (typeof protein === "number") entry.protein = protein;
  if (typeof carbs === "number") entry.carbs = carbs;
  if (typeof fat === "number") entry.fat = fat;
  return entry;
}

const SEXES = ["male", "female"];
const ACTIVITIES = ["sedentary", "light", "moderate", "active", "very_active"];
const GOALS = ["lose", "maintain", "gain"];

export function parseProfile(input: unknown): UserProfile | null {
  if (!isRecord(input)) return null;
  const { sex, age, heightCm, weightKg, activity, goal, customTarget } = input;
  if (!SEXES.includes(sex as string)) return null;
  if (!inRange(age, 13, 120) || !inRange(heightCm, 100, 250) || !inRange(weightKg, 30, 350)) {
    return null;
  }
  if (!ACTIVITIES.includes(activity as string) || !GOALS.includes(goal as string)) return null;
  if (customTarget !== undefined && customTarget !== null && !inRange(customTarget, 0, 10000)) {
    return null;
  }
  const profile: UserProfile = {
    sex: sex as UserProfile["sex"],
    age,
    heightCm,
    weightKg,
    activity: activity as UserProfile["activity"],
    goal: goal as UserProfile["goal"],
  };
  if (typeof customTarget === "number" && customTarget > 0) profile.customTarget = customTarget;
  return profile;
}

export function parseTargets(input: unknown): TargetChange[] | null {
  if (!Array.isArray(input) || input.length > 1000) return null;
  const out: TargetChange[] = [];
  for (const item of input) {
    if (!isRecord(item)) return null;
    const { from, target } = item;
    if (typeof from !== "string" || (from !== "" && !isDateKey(from))) return null;
    if (!inRange(target, 0, 10000)) return null;
    out.push({ from, target });
  }
  return out;
}
