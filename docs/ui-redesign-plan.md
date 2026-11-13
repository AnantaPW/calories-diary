# UI Redesign Plan: dark theme, mobile layout, History calendar

Status: implemented on 2026-11-12 with the recommended answers to the open decisions (dark only, weeks start Monday, Geist with tabular numerals, text wordmark).
Antislop mode: during (session override).

## Design Read

Reading this as: a personal food diary for one person on a diet, mostly opened on a phone at mealtimes (often in the evening), in a warm, quiet "kitchen notebook at night" style, dial **ENERGY 2 / RHYTHM 2 / MOTION 1**.

- ENERGY 2: it should feel like a crafted personal tool, not a government form, but it is used several times a day, so it must not shout.
- RHYTHM 2: screens share one system, with deliberate breaks (the calendar grid, the big "remaining" number) where the content is different.
- MOTION 1: hover/press states, the progress fill and a sheet sliding in. No scroll reveals, no loops.

**Focal point per screen**

| Screen | The one thing the eye lands on | Why |
|---|---|---|
| Today | kcal remaining (large number) | The decision is "can I eat this?" |
| Diary | the selected day's meal list + Add food | The job is logging |
| History (new) | the month grid, coloured by day status | The job is spotting patterns and finding a past day |
| Profile | Daily target | Everything else on the page explains it |

**Identity motif:** every calorie figure is set in tabular numerals with a thin "fill line" under it showing progress against the target. The same fill line appears on the Today card, each meal total, and each calendar day, so one gesture ties the app together.

## 1. Dark theme

Dark is the default because you asked for it, and the reason holds up: the app is opened at dinner and before bed, often in dim light. The colours are warm charcoal, not blue-black or purple, so it reads like a notebook at night and not "tech".

### Tokens (replace the current `:root` and `@theme` in `src/app/globals.css`)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#15140F` | page |
| `--surface` | `#1E1D18` | cards, sheets |
| `--surface-2` | `#27261F` | inputs, macro chips, hovered rows |
| `--border` | `#34322A` | hairlines only |
| `--text` | `#ECE8DD` | body and numbers |
| `--muted` | `#A39E8F` | labels, secondary text |
| `--brand` (core) | `#5CC98A` | progress fill, primary button, "within target" |
| `--on-brand` | `#12110D` | text on the primary button |
| `--over` (the one accent) | `#E8A33D` | "over target" only: remaining number, fill, calendar day |
| `--danger` | `#F07A6A` | delete confirmation only |

Contrast, measured with the antislop contrast checker (WCAG AA needs 4.5:1):

- text on bg: 15.06:1 · muted on surface: 6.31:1 · muted on surface-2: 5.67:1
- brand on surface: 8.18:1 · over on surface: 7.83:1 · danger on surface: 6.19:1
- on-brand text on brand button: 9.15:1

Palette count: 1 core colour (green) + 1 accent (amber) + neutrals, with red kept for the delete action only. Amber means "over target" everywhere, and nothing else, so it stays meaningful. Today "over" is red, which reads like an error; for a diet diary going over is information, not a failure, so amber is the better fit.

### Other theme work

- `color-scheme: dark` on `:root` so native date pickers, selects and scrollbars render dark.
- `<meta name="theme-color" content="#15140F">` via `viewport` export in `layout.tsx`, so the phone's browser bar matches.
- Shadows are dropped almost entirely (they barely show on dark). Elevation comes from surface steps (`bg` → `surface` → `surface-2`). The bottom sheet is the only element with a shadow, because it really sits above the page.
- Radius scale: 8px inputs/buttons, 14px cards, 20px top corners on the bottom sheet. No pills.
- Visible focus ring on every control: 2px `--brand` outline with 2px offset (replace the current `outline-none`).
- `cursor: pointer` on interactive elements and `not-allowed` on disabled ones, set once in the base layer.

**Open decision (light mode):** dark-only keeps the scope small. If you also want a light theme, it becomes a working toggle in Profile with both themes checked for contrast. My recommendation: dark only for now.

## 2. Responsive layout (phone first)

Three layout states, set where the content breaks, not by device list:

| Width | Navigation | Layout |
|---|---|---|
| < 640px (phones) | Bottom tab bar | One column, mobile type scale, tighter padding |
| 640 to 1023px (large phones landscape, tablets) | Top bar | Meals in 2 columns, calendar full width |
| ≥ 1024px (laptops) | Top bar | Diary: day log + Add food side by side. History: calendar + selected-day panel side by side |

### Navigation (`src/components/Nav.tsx`)

- Phones: fixed bottom tab bar with four labelled tabs: **Today, Diary, History, Profile**. Each tab at least 56px tall with icon + text label (no bare icons). Content gets bottom padding equal to the bar height + `env(safe-area-inset-bottom)` so nothing hides under it.
- From 640px: the current top bar, with the new History link.
- Remove the 🥗 emoji from the wordmark. The name "Calorie Diary" stays as a text wordmark. A real logo is out of scope unless you want to supply or brief one.
- Icons: four simple glyphs that match their tab (sun/today, open book, calendar grid, person). Drawn as inline SVG at one consistent stroke weight, not pulled from a default icon library look.

### Sizes

- Type: fluid with `clamp()`. The focal number (kcal remaining) goes from about 40px on phones to 56px on desktop; body stays 15 to 16px.
- Page padding 16px on phones, 24px from 640px. Card padding 16px on phones, 20px above.
- Every tap target at least 44×44px with at least 8px between neighbours. That fixes today's day-stepper arrows (styled as inputs, about 36px) and the ✕ delete button (about 16px).
- Number inputs get `inputMode="decimal"` / `"numeric"` so phones open the number keyboard.
- No horizontal scroll at 320px wide; this gets checked on every screen.

## 3. History calendar (new: `/history`)

**What it answers:** "How did each day go against my target, and what did I eat on day X?"

### Layout

- Header: month name with previous / next month buttons (44px) and a "This month" button when you are not on the current month.
- Month grid, 7 columns, weeks starting Monday (open decision: Monday or Sunday).
- Each day cell shows:
  - the date number
  - a fill line under it (the identity motif): green when the day is within target, amber when over, length = kcal ÷ target
  - from 640px up, the kcal total as a number (e.g. `1,840`); on phones the cell is about 44px wide, too narrow for the number, so the line carries it
  - days with nothing logged: date only, no line (not shown as "0", which would read as "ate nothing")
  - today: outlined ring; future days: dimmed and not selectable
- Tapping a day selects it:
  - phones: a bottom sheet with that day's total vs target, macros, the meals with their items, and an **Open in Diary** button
  - from 1024px: the same content in a panel beside the calendar
  - the sheet closes with Escape, a close button, or tapping outside; focus returns to the day cell
- Under the grid, a short month summary computed from your own entries only: days logged, average kcal on logged days, days over target. If nothing was logged that month, no numbers are shown at all.
- Keyboard: arrow keys move between days, Enter opens, Page Up/Down change month. The grid uses `role="grid"` and each cell has an accessible name like "12 November, 1,840 of 1,900 kcal, within target".

### States

- **Loading:** the real month grid with dates but no fill lines until storage has been read (the grid shape is known before the data).
- **Empty month:** "Nothing logged in October. Pick a day to add food to it." Past days stay tappable and open the Diary on that date.
- **First use (no entries at all):** "Your history fills in as you log food." with a **Log today's food** button.
- **Error:** if stored data cannot be read, "Your saved diary couldn't be read in this browser." Today `readJSON` silently falls back to empty, which would look like lost data; `lib/storage.ts` will return an error flag so the UI can say what happened.

### Data changes

- `src/lib/calories.ts`: add `dailyTotals(entries)`: a map of date → totals, computed once per render with `useMemo`.
- `src/app/diary/page.tsx`: read `?date=YYYY-MM-DD` so **Open in Diary** links straight to that day (and the date stays in the URL, so Back works).
- **Target history.** Today, past days are compared against your *current* target. If you change weight or goal, every past day would be re-judged. Plan: when the profile is saved, store `{ from: date, target }` in a small history list, and the calendar uses the target that was active on each day. Days before the first saved profile use the current target.

### Files

- `src/app/history/page.tsx` (new)
- `src/components/CalendarMonth.tsx`, `CalendarDay.tsx`, `DaySheet.tsx` (new)
- `src/lib/date.ts`: month grid helpers (`monthMatrix`, `startOfMonth`, `shiftMonth`)

## 4. Improvements to the existing screens

### Today (`src/app/page.tsx`, `CalorieProgress.tsx`)

- Make **kcal remaining** the focal number (it's the decision). Consumed and target become one smaller line: `1,240 eaten of 1,900`.
- Macros on a single row of three small chips instead of three boxes.
- Meal sections: show only meals with entries in full; empty meals collapse to one line ("Dinner: nothing yet, Add") that opens the Diary with that meal pre-selected.
- Loading state: the card outline with placeholders shaped like the real numbers, not a blank page as now.

### Diary (`src/app/diary/page.tsx`, `FoodEntryForm.tsx`, `MealSection.tsx`)

- Day stepper: real 44px buttons for previous / next and the date in the middle; tapping the date opens the native date picker. "Today" button when away from today.
- **Add food form:**
  - Visible labels on every field (today they are placeholders only, which vanish while typing).
  - Meal pre-selected by time of day (before 10:30 breakfast, before 15:00 lunch, before 21:00 dinner, else snack), still changeable.
  - Macros (protein / carbs / fat) tucked under "Add macros (optional)" so the quick path is name + kcal.
  - Phones: a full-width **Add food** button above the meals opens the form in a bottom sheet; from 1024px the form sits beside the log.
  - After adding, a short "Added Nasi goreng to Lunch" message (with the food name you typed).
- **Delete:** a 44px button; instead of a confirm dialog, the item is removed with an **Undo** option in a toast for 5 seconds.

### Profile (`src/app/profile/page.tsx`)

- **Daily target** becomes the focal number at the top; BMR and TDEE sit below it as a short explanation ("BMR 1,420 × activity 1.375 = TDEE 1,953, minus 500 for weight loss").
- Form in one column on phones, two from 640px; number keyboards on phones.
- "Saved ✓" becomes the button briefly reading "Saved" so the confirmation sits where you're looking.

## 5. Order of work

1. Theme tokens, base styles, focus ring, `theme-color` (everything else builds on these).
2. Responsive nav with bottom tab bar and History link (History page stub with its empty state, so the link never goes nowhere).
3. Storage error flag + `dailyTotals` + target history.
4. History calendar with day sheet/panel, all four states, keyboard support.
5. Diary: `?date=` support, stepper, form labels and sheet, undo delete.
6. Today and Profile refinements.
7. Check: `npm run typecheck`, `npm run lint`, `npm run build`, then click through every control at 360px, 768px and 1280px, keyboard only, and check the console. Then the antislop Delivery Gate as a PASS/FAIL report.

## Open decisions

1. Light mode: dark only (recommended) or a toggle with both themes?
2. Calendar week starts on Monday (recommended) or Sunday?
3. Typeface: Geist is the current default. Keep it with tabular numerals turned on for every figure (recommended, numbers are the content), or swap to something warmer to match the "notebook at night" mood?
4. Logo: keep the plain text wordmark (recommended), or do you want to supply or brief an icon?
