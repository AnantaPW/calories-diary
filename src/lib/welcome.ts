import type { ActivityLevel, Goal, Sex, UserProfile } from "./types";

/** First-run setup answers. Numbers stay as typed until the end, so an empty field is "not answered", not 0. */
export interface WelcomeDraft {
  goal: Goal | null;
  sex: Sex | null;
  age: string;
  heightCm: string;
  weightKg: string;
  activity: ActivityLevel | null;
  customTarget: string;
}

export type WelcomeField = keyof WelcomeDraft;

export const EMPTY_DRAFT: WelcomeDraft = {
  goal: null,
  sex: null,
  age: "",
  heightCm: "",
  weightKg: "",
  activity: null,
  customTarget: "",
};

export const WELCOME_STEPS = 4;

/** Same limits as parseProfile on the server. */
function numberProblem(value: string, min: number, max: number, unit: string): string | null {
  if (value.trim() === "") return "Fill this in to continue.";
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return `Use a number from ${min} to ${max}${unit}.`;
  return null;
}

/** What is wrong on one step, in field order. Empty when the step can move on. */
export function stepProblems(step: number, d: WelcomeDraft): Partial<Record<WelcomeField, string>> {
  const out: Partial<Record<WelcomeField, string>> = {};
  const add = (field: WelcomeField, problem: string | null) => {
    if (problem) out[field] = problem;
  };
  if (step === 1) add("goal", d.goal ? null : "Pick one to continue.");
  if (step === 2) {
    add("sex", d.sex ? null : "Pick one to continue.");
    add("age", numberProblem(d.age, 13, 120, ""));
    add("heightCm", numberProblem(d.heightCm, 100, 250, " cm"));
    add("weightKg", numberProblem(d.weightKg, 30, 350, " kg"));
  }
  if (step === 3) add("activity", d.activity ? null : "Pick one to continue.");
  if (step === 4 && d.customTarget.trim() !== "") {
    add("customTarget", numberProblem(d.customTarget, 1, 10000, " kcal"));
  }
  return out;
}

/** The profile once steps 1 to 3 pass; null while any answer is missing or out of range. */
export function draftToProfile(d: WelcomeDraft): UserProfile | null {
  for (const step of [1, 2, 3]) {
    if (Object.keys(stepProblems(step, d)).length > 0) return null;
  }
  const profile: UserProfile = {
    goal: d.goal!,
    sex: d.sex!,
    age: Number(d.age),
    heightCm: Number(d.heightCm),
    weightKg: Number(d.weightKg),
    activity: d.activity!,
  };
  const custom = Number(d.customTarget);
  if (d.customTarget.trim() !== "" && Number.isFinite(custom) && custom > 0) profile.customTarget = custom;
  return profile;
}
