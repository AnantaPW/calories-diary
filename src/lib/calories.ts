import type {
  ActivityLevel,
  FoodEntry,
  Goal,
  MacroTotals,
  MealType,
  TargetChange,
  UserProfile,
} from "./types";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (little or no exercise)",
  light: "Light (1–3 days/week)",
  moderate: "Moderate (3–5 days/week)",
  active: "Active (6–7 days/week)",
  very_active: "Very active (physical job or 2x/day)",
};

/** Daily calorie adjustment applied to TDEE per goal (~0.5 kg/week). */
export const GOAL_ADJUSTMENT: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose: "Lose weight",
  maintain: "Maintain weight",
  gain: "Gain weight",
};

/** Basal Metabolic Rate via the Mifflin–St Jeor equation. */
export function calculateBMR(p: Pick<UserProfile, "sex" | "age" | "heightCm" | "weightKg">): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return Math.round(p.sex === "male" ? base + 5 : base - 161);
}

/** Total Daily Energy Expenditure. */
export function calculateTDEE(p: UserProfile): number {
  return Math.round(calculateBMR(p) * ACTIVITY_MULTIPLIERS[p.activity]);
}

/** The calculated target is never set below this. */
export const MIN_TARGET: Record<UserProfile["sex"], number> = {
  male: 1500,
  female: 1200,
};

/** Daily calorie target, floored at a conservative minimum. */
export function calculateDailyTarget(p: UserProfile): number {
  if (p.customTarget && p.customTarget > 0) return Math.round(p.customTarget);
  return Math.max(MIN_TARGET[p.sex], calculateTDEE(p) + GOAL_ADJUSTMENT[p.goal]);
}

export function sumEntries(entries: FoodEntry[]): MacroTotals {
  return entries.reduce<MacroTotals>(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/** Totals for every day that has at least one entry, keyed by YYYY-MM-DD. */
export function dailyTotals(entries: FoodEntry[]): Map<string, MacroTotals> {
  const byDate = new Map<string, FoodEntry[]>();
  for (const e of entries) {
    const list = byDate.get(e.date);
    if (list) list.push(e);
    else byDate.set(e.date, [e]);
  }
  const totals = new Map<string, MacroTotals>();
  byDate.forEach((list, date) => totals.set(date, sumEntries(list)));
  return totals;
}

/**
 * The target that was active on `date`. Days are judged against the target
 * the user had at the time, so changing the profile never rewrites history.
 */
export function targetForDate(
  history: TargetChange[],
  date: string,
  currentTarget: number,
): number {
  let active: number | undefined;
  for (const change of history) {
    if (change.from <= date) active = change.target;
  }
  return active ?? currentTarget;
}

/** Returns the history with a profile change recorded for `today`. */
export function recordTargetChange(
  history: TargetChange[],
  previousTarget: number,
  nextTarget: number,
  today: string,
): TargetChange[] {
  if (previousTarget === nextTarget) return history;
  // First change ever: remember what applied to all the days before it.
  const base = history.length === 0 ? [{ from: "", target: previousTarget }] : history;
  return [...base.filter((c) => c.from !== today), { from: today, target: nextTarget }];
}

/** Which meal a new entry most likely belongs to at this time of day. */
export function mealForTime(now: Date = new Date()): MealType {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < 10 * 60 + 30) return "breakfast";
  if (minutes < 15 * 60) return "lunch";
  if (minutes < 21 * 60) return "dinner";
  return "snack";
}

/** The profile used until the person saves their own. */
export const DEFAULT_PROFILE: UserProfile = {
  sex: "female",
  age: 30,
  heightCm: 165,
  weightKg: 65,
  activity: "light",
  goal: "lose",
};
