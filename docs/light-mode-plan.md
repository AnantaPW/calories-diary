# Light mode plan

Status: built 2026-11-14 on shadcn-rework (not committed). Tickets: .scratch/light-mode/issues/

Dark stays the evening theme. Light mode is for lunchtime and daylight, when the dark brown reads as murky on a bright phone screen. Both themes keep the same idea: **a plate on a table**. The plate is always the brightest surface on the page.

## Direction: daylight kitchen

In dark mode, the plate is warm ceramic on a dark wooden table at night. In light mode, it's white porcelain on a pale stone worktop by a window.

- **Table:** pale warm stone grey. It is deliberately greyer than the cream-paper look (#F4F1EA family) that most light themes use, so the page reads as a kitchen surface, not stationery.
- **Plate:** near-white porcelain. Brightest surface.
- **The one bold move:** in daylight the plate casts a real, soft contact shadow on the table. Dark mode has no shadows (it's flat, lit by surface steps). Light mode gives only the plate card one, so the ring sits *on* something. Every other card stays flat.
- Type, layout, motion and the meal glyphs don't change. Bricolage Grotesque and Geist stay.

## Palette (light)

| Token | Role | Value | Checked (WCAG) |
|---|---|---|---|
| `--background` | table, stone | `#e3e0d8` | ink 12.17:1 |
| `--card` | board | `#f3f1ec` | ink 14.22:1 |
| `--plate` | porcelain | `#fffefb` | ink 15.91:1 |
| `--foreground` | ink | `#24211b` | |
| `--muted-foreground` | smoke | `#5f594b` | 5.28 table, 6.90 plate |
| `--border` | dividers | `#cfc9bc` | decorative only |
| `--over` | amber, over target | `#925000` | 4.72 table, 6.18 plate |
| `--destructive` | chili, remove | `#b3362a` | 4.58 table |
| `--primary-foreground` | button text | `#ffffff` | ≥5.8:1 on every theme colour |

The pastels used in dark mode fail on a light page (lime on white is about 1.5:1). Each theme colour gets a deeper light-mode partner, at least 4.5:1 on the table so it works as link text, not only as an arc:

| Theme colour | Dark (unchanged) | Light | On table / plate |
|---|---|---|---|
| Herb green | `#5cc98a` | `#1a6e40` | 4.75 / 6.22 (one step darker than `#1c7343`, which was 4.44 on the table) |
| Sky blue | `#6ab0f3` | `#2660a3` | 4.85 / 6.34 |
| Lavender | `#b9a3f5` | `#6650c2` | 4.56 / 5.96 |
| Rose | `#f29bbe` | `#a3355f` | 4.93 / 6.44 |
| Sea teal | `#3fcfc0` | `#0b6d64` | 4.70 / 6.15 |
| Lime zest | `#b5dc4f` | `#4a680a` | 4.86 / 6.36 |
| Hibiscus | `#f27ad6` | `#a2318f` | 4.72 / 6.17 |

Meal arcs (`--chart-2..4`) currently mix the theme colour toward ink. In light mode that pushes the lighter arcs toward near-black, so the light set mixes toward the plate instead, stopping where each arc still has 3:1 on the plate. The exact steps get measured when it's built.

## How it's chosen

- Profile gets a **Appearance** choice next to Theme colour: **System**, **Light**, **Dark**. It previews right away and is saved per account, just like the theme colour.
- Saved in `settings.mode` beside `settings.accent`. Old accounts without the field read as the default.
- The server writes `data-mode` on `<html>`, as it already does for `data-accent`. "System" is resolved in CSS with `prefers-color-scheme`, so there's no script and no flash of the wrong theme.
- shadcn components use the `dark:` variant through `class="dark"`. That variant gets remapped to `data-mode` (and to the media query when the mode is System), so the components follow along without edits.
- Logged-out pages (login, sign up, not found) follow the system setting.
- Browser chrome: `color-scheme`, `themeColor` and the favicon each get a light and a dark value. The light favicon already exists but uses cream `#f6f2ea`; it gets the stone and porcelain values above.

## Decided

**Default for people who haven't chosen: System** (decided 2026-11-14). The OS is usually dark at night, which is when the app is mostly used.

Tickets: `.scratch/light-mode/issues/`.
