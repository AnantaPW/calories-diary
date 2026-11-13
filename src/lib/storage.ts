/*
 * Browser storage from before accounts existed. The diary now lives on the
 * server; these keys are only read to offer a one-time import
 * (components/BrowserImport.tsx) and are cleared afterwards.
 */
export const LEGACY_KEYS = {
  entries: "calorie-diary:entries",
  profile: "calorie-diary:profile",
  targets: "calorie-diary:targets",
  /** Set when the person chose to leave the browser data where it is. */
  dismissed: "calorie-diary:import-dismissed",
} as const;

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
