import type { MealType } from "./types";

/** A part of the day: the greeting, the meal it belongs to (none late at night), and where the sun or moon sits. */
export interface DayPart {
  greeting: "Morning" | "Afternoon" | "Evening" | "Late one";
  meal: MealType | null;
  /** True from 22:00 to 4:59: the moon is up instead of the sun. */
  night: boolean;
  /** 0 at the left end of the sky arc, 1 at the right. */
  t: number;
}

/** Sun is up 5:00–21:59 (17 hours), the moon 22:00–4:59 (7 hours). */
export function dayPart(d: Date): DayPart {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 5 && h < 22) {
    const t = (h - 5) / 17;
    if (h < 11) return { greeting: "Morning", meal: "breakfast", night: false, t };
    if (h < 16) return { greeting: "Afternoon", meal: "lunch", night: false, t };
    return { greeting: "Evening", meal: "dinner", night: false, t };
  }
  return { greeting: "Late one", meal: null, night: true, t: ((h + 2) % 24) / 7 };
}

/** The name to greet: the username, or the part before "@" for an email-style one. */
export function greetName(username: string | null): string | null {
  const name = username?.split("@")[0].trim();
  return name || null;
}
