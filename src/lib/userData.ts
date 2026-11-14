import type { Theme } from "./theme";
import type { FoodEntry, TargetChange, UserProfile } from "./types";

/** Everything stored for one person (data/users/<id>.json). */
export interface UserData {
  version: 1;
  /** null until the person saves a profile. */
  profile: UserProfile | null;
  targets: TargetChange[];
  entries: FoodEntry[];
  settings: Theme;
}

/** What GET /api/me returns. */
export interface MeResponse {
  username: string;
  /** Shows the Admin link in Profile; the admin page and API check again on the server. */
  isAdmin: boolean;
  data: UserData;
}

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 32;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const USERNAME_PATTERN = /^[A-Za-z0-9_-]+$/;

/** Returns why a username can't be used, or null when it's fine. */
export function usernameProblem(username: string): string | null {
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return `Use ${USERNAME_MIN} to ${USERNAME_MAX} characters.`;
  }
  if (!USERNAME_PATTERN.test(username)) {
    return "Use only letters, numbers, _ and -.";
  }
  return null;
}

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "passw0rd", "12345678", "123456789",
  "1234567890", "11111111", "00000000", "87654321", "qwertyui", "qwerty123",
  "qwertyuiop", "asdfghjk", "iloveyou", "abc12345", "abcd1234", "letmein1",
  "welcome1", "sunshine", "princess", "football", "baseball", "superman",
  "trustno1", "dragon12", "monkey12", "admin123", "changeme", "caloriediary",
]);

/** Returns why a password can't be used, or null when it's fine. */
export function passwordProblem(password: string, username = ""): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) return "This password is too common. Choose another.";
  if (username && lower === username.toLowerCase()) return "Don't use your username as the password.";
  return null;
}
