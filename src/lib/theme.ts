/*
 * Theme colour choices. Only the main colour changes: amber ("over target"),
 * red ("remove") and the charcoal surfaces stay fixed in every theme, which is
 * why there is no orange or red option. Each colour is checked at WCAG AA on
 * the lightest surface (#27261F) and with the dark button text on top of it.
 */
export const ACCENTS = [
  { value: "green", label: "Herb green", color: "#5cc98a" },
  { value: "blue", label: "Sky blue", color: "#6ab0f3" },
  { value: "lavender", label: "Lavender", color: "#b9a3f5" },
  { value: "rose", label: "Rose", color: "#f29bbe" },
] as const;

export type Accent = (typeof ACCENTS)[number]["value"];

export const DEFAULT_ACCENT: Accent = "green";

export function isAccent(value: unknown): value is Accent {
  return ACCENTS.some((a) => a.value === value);
}
