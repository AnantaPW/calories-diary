/*
 * Theme colour choices. Only the main colour changes: amber ("over target"),
 * red ("remove") and the surfaces stay fixed in every theme, which is why
 * there is no orange, yellow or red option. `color` is the dark-mode value,
 * `light` its deeper light-mode partner (the pastels fail on a light page).
 * Values match globals.css, where the contrast checks are listed.
 */
export const ACCENTS = [
  { value: "green", label: "Herb green", color: "#5cc98a", light: "#1a6e40" },
  { value: "blue", label: "Sky blue", color: "#6ab0f3", light: "#2660a3" },
  { value: "lavender", label: "Lavender", color: "#b9a3f5", light: "#6650c2" },
  { value: "rose", label: "Rose", color: "#f29bbe", light: "#a3355f" },
  { value: "teal", label: "Sea teal", color: "#3fcfc0", light: "#0b6d64" },
  { value: "lime", label: "Lime zest", color: "#b5dc4f", light: "#4a680a" },
  { value: "hibiscus", label: "Hibiscus", color: "#f27ad6", light: "#a2318f" },
] as const;

export type Accent = (typeof ACCENTS)[number]["value"];

export const DEFAULT_ACCENT: Accent = "green";

export function isAccent(value: unknown): value is Accent {
  return ACCENTS.some((a) => a.value === value);
}

/** Light or dark. "system" follows the device, resolved in CSS so there's no flash. */
export const MODES = [
  { value: "system", label: "System", hint: "Follows your device" },
  { value: "light", label: "Light", hint: "For daylight" },
  { value: "dark", label: "Dark", hint: "For evenings" },
] as const;

export type Mode = (typeof MODES)[number]["value"];

export const DEFAULT_MODE: Mode = "system";

export function isMode(value: unknown): value is Mode {
  return MODES.some((m) => m.value === value);
}

export interface Theme {
  accent: Accent;
  mode: Mode;
}

export const DEFAULT_THEME: Theme = { accent: DEFAULT_ACCENT, mode: DEFAULT_MODE };
