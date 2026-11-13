export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snacks" },
];

export interface FoodEntry {
  id: string;
  /** Local date in YYYY-MM-DD format */
  date: string;
  meal: MealType;
  name: string;
  calories: number;
  protein?: number; // grams
  carbs?: number; // grams
  fat?: number; // grams
  createdAt: string; // ISO timestamp
}

export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type Goal = "lose" | "maintain" | "gain";

export interface UserProfile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  /** If set, overrides the calculated daily target */
  customTarget?: number;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** The daily target that applies from `from` (YYYY-MM-DD, "" = since the start). */
export interface TargetChange {
  from: string;
  target: number;
}
