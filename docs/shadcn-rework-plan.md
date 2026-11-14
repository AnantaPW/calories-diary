# Plan: rebuild the UI on shadcn/ui

Status: implemented on the `shadcn-rework` branch with the recommended answer to every open decision (warm surfaces, Base UI, the CLI's icon set `hugeicons` for component internals, shadcn `Calendar`). Not merged. `Sheet.tsx` and `CalendarMonth.tsx` stay as thin wrappers (Drawer/Dialog switch, plate days on `Calendar`); `Toast.tsx` is gone.
Antislop mode: during (session override). Written with the project's shadcn skill (`.agents/skills/shadcn`) and the frontend-design skill.

## Why, and what changes

Today every control is hand-made: our own `.card`, `.btn-*`, `.input` classes, our own sheet (`<dialog>`), toast, calendar grid, form layout and loading text. It works, but each piece has its own spacing and states, and every fix is a one-off.

shadcn/ui gives the app one component system, copied into the repo as source, so we still own every line:

- **Consistency:** buttons, fields, sheets, toasts and cards share one set of heights, radii, focus rings and states.
- **Accessibility for free:** focus management, keyboard support and ARIA come from Base UI primitives instead of our hand-rolled versions.
- **Less custom code:** the calendar grid, sheet, toast, form layout, loading and empty states are replaced by maintained components.

What it does **not** change: the identity. The plate ring, meal glyphs, Bricolage Grotesque, the dark theme, the four theme colours and "amber means over target" all stay. shadcn becomes the skeleton; the plate stays the face.

## Project facts (from `npx shadcn@latest info --json`)

| Field | Value |
|---|---|
| Framework | Next.js 16 App Router, `src/` directory, React Server Components |
| Tailwind | v4, CSS in `src/app/globals.css` |
| Import alias | `@` |
| shadcn config | none yet (no `components.json`) |

## Setup decisions

| Decision | Choice | Reason |
|---|---|---|
| Primitive library | `base` (Base UI) | The skill's default; Radix only if you prefer it. Decides `render` vs `asChild` in our code. |
| Style | `maia` | Its geometry is closest to ours: 40px+ controls, 12px+ card radius, generous padding. We then pin 44px controls for thumbs. |
| Theme | Dark only, kept | `class="dark"` on `<html>` so the components' own `dark:` styles apply; our values go into the shadcn variables. |
| Icons inside components | CLI icon library for chevrons, close and check marks only | Everything that carries meaning (tabs, meals, "+") keeps our own hand-drawn glyphs, so the app doesn't take on a stock icon-set look. See open decision 3. |
| Toast | Base UI `toast` (or `sonner` if `toast` isn't offered for our setup) | The skill pairs `toast` with Base UI. `toast` didn't resolve in a lookup before setup, so this is confirmed after `init`. |
| Where the work happens | A `shadcn-rework` branch | `init` rewrites `globals.css` and adds dependencies; the branch keeps `main` deployable until it's done. |

Commands, run on the branch:

```bash
npx shadcn@latest init --base base --preset maia
```

```bash
npx shadcn@latest add button card field input input-group native-select select toggle-group tabs collapsible drawer dialog calendar progress skeleton spinner empty alert item separator radio-group sonner
```

Every added file is read and checked after install, as the skill requires.

## Design read, and the review against defaults

Reading this as: a personal food diary opened at the table several times a day, mostly on a phone, mostly in the evening. Its one job is answering "how much is left today, and what did I eat?" in a glance. Dial ENERGY 2 (3 on the plate) / RHYTHM 2 / MOTION 2.

**First draft, then what I changed.** My first pass was "keep the current charcoal and green, swap the parts for shadcn." Checked against the defaults generated designs fall into, that lands close to one: a near-black page with a single bright green accent, plus shadcn's stock look of identical rounded cards. Two revisions:

1. **Table and plate, not one flat dark.** The page becomes a deep warm "table" brown, and the focal surface becomes a lighter warm "ceramic", so the ring sits on something that reads as a plate on a table. Food diary, not dark dashboard.
2. **Cards earn their surface.** Only the plate card gets the ceramic surface; meals become rows (`Item`) inside one card; forms and settings sit on the table with `Separator`s. That avoids the stack of identical rounded boxes.

## Tokens

### Colour (checked at WCAG AA)

| Name | Hex | shadcn variable | Role |
|---|---|---|---|
| Table | `#16130E` | `--background` | Page |
| Board | `#1F1C16` | `--card`, `--popover` | Ordinary cards, sheets, menus |
| Ceramic | `#2B271F` | new `--plate` | The focal "plate" surface, one per screen |
| Ink | `#EEE9DD` | `--foreground`, `--card-foreground` | Text |
| Smoke | `#A8A291` | `--muted-foreground` | Secondary text |
| Herb (theme colour) | `#5CC98A` | `--primary`, `--ring`, `--chart-1` | Actions, focus, the first meal arc |
| Amber | `#E8A33D` | new `--over` | Over target, nothing else |
| Chili | `#F07A6A` | `--destructive` | Remove |

Measured: Ink on Table 15.29:1. Smoke on Board 6.67:1, on Ceramic 5.83:1. Herb on Ceramic 7.20:1. Amber on Ceramic 6.89:1.

- `--muted`, `--accent`, `--secondary`, `--border` and `--input` are tone steps between Board and Ceramic.
- **Meal arcs** become `--chart-1` to `--chart-4`: the theme colour tinted toward Ink, as now. Each theme colour (blue, lavender, rose) overrides `--primary`, `--ring` and `--chart-1..4` through `data-accent`.

### Type

- **Bricolage Grotesque** (kept): `--font-heading`, so `CardTitle`, `DrawerTitle` and `DialogTitle` use it, plus page titles and the focal numbers. Its digits are even-width (measured earlier), so numbers don't jump.
- **Geist** (kept): body, labels, every list number.
- Type utilities, as the skill says (not `--text-*` keys, which `cn()` would confuse with colours):
  - `type-title`: clamp(28px to 32px), 600 weight, tight tracking.
  - `type-focal`: clamp(48px to 64px), 700 weight, tabular figures.
  - `type-section`: 18px, 600 weight.
- Sentence case everywhere; no all-caps labels.

### Shape and size

| Thing | Value | Pinned where |
|---|---|---|
| Controls (button, input, select, toggle, tabs) | 44px | Every `h-*` / `size-*` default in the component files, changed together |
| Controls radius | 10px | `--radius-lg` |
| Cards, dialogs | 16px | `--radius-xl` |
| Plate card, toasts | 24px | `--radius-2xl` |
| Drawer top corners | 20px | Drawer component |
| Shadows | none except Drawer and Dialog | `--shadow-xs: 0 0 #0000` |

## Screen by screen

### Today (phone)

```
┌───────────────────────────────┐
│ Today                         │  type-title
│ Saturday, November 14         │  muted
│ ┌───────────────────────────┐ │
│ │        ╭─────────╮        │ │  Card variant "plate" (Ceramic, 24px)
│ │       ╱ Remaining ╲       │ │  PlateRing (custom, kept)
│ │      │    214      │      │ │  type-focal
│ │       ╲ of 1,384  ╱       │ │
│ │        ╰─────────╯        │ │
│ │ 1,170 kcal eaten          │ │
│ │ Protein ▓▓░░░░░░  30 g    │ │  Progress ×3
│ │ Carbs   ▓▓▓▓▓░░░  90 g    │ │
│ │ Fat     ▓▓▓░░░░░  24 g    │ │
│ └───────────────────────────┘ │
│ ┌───────────────────────────┐ │  Card (Board)
│ │ ☼ Breakfast   320   + Add │ │  ItemGroup / Item: ItemMedia = meal glyph
│ │   Oatmeal           320   │ │
│ │ ──────────────────────────│ │  Separator
│ │ ☾ Dinner · nothing yet  + │ │
│ └───────────────────────────┘ │
├───────────────────────────────┤
│ Today  Diary  (+)  History  Me│  bottom bar (custom, kept)
└───────────────────────────────┘
```

From 1024px: plate card left (7 columns), meals card right (5 columns), as now. Content is left-aligned throughout; only the number inside the ring is centred.

### Component mapping

| Today it is | Becomes | Notes |
|---|---|---|
| `.card`, `.card-focal` | `Card` + `CardHeader/Title/Content` | New `variant="plate"` in `card.tsx` for the Ceramic surface, instead of colour classes on the card |
| `.btn-primary/quiet/icon` | `Button` `default` / `outline` / `ghost`, `size="icon"` | Icons get `data-icon`, no sizing classes |
| Our `<dialog>` Sheet | `Drawer` on phones, `Dialog` from 640px | Same content, one wrapper picks by width. Titles required |
| Our Toast + Undo | `toast` (or `sonner`) with an action | "Removed Oatmeal · Undo", "Added 2 items to Dinner" |
| Food form layout | `FieldGroup` + `Field` + `FieldLabel` | Validation via `data-invalid` / `aria-invalid` |
| AI input / Manual input switch | `Tabs` | It switches whole panels, so Tabs, not a toggle |
| Meal picker | `ToggleGroup` of 4 with the meal glyphs | 2 to 7 options use ToggleGroup |
| "Add macros (optional)" | `Collapsible` | |
| AI review items | `Item` per food inside `ItemGroup`, `Field`s for numbers | |
| AI errors, storage error, import notice | `Alert` (with actions for import) | |
| "Loading…" text | `Skeleton` shaped like the plate and meal rows | |
| "Nothing logged yet" | `Empty` with the one action that fills it | |
| Macro bars | `Progress` | |
| History month grid | `Calendar`, Monday first, future days disabled, custom `DayButton` that draws the plate | Its keyboard navigation replaces our hand-written one |
| Diary week strip | `ToggleGroup` (7 days, single choice) + `Button`s for week and picker | |
| Profile selects | `NativeSelect` | Native pickers stay best on phones |
| Theme swatches | `RadioGroup` choice cards (`FieldLabel` around `RadioGroupItem`) | Plate preview kept inside each card |
| Password "Show" | `InputGroup` + `InputGroupAddon` button | |
| Saving / estimating | `Button` + `Spinner` + `disabled` | Buttons have no loading prop |
| Dividers | `Separator` | |
| Conditional classes | `cn()` | Replaces template-string ternaries |
| `space-y-*` stacks | `flex flex-col gap-*` | Skill rule, applied in every file touched |

### What stays custom, and why

- **PlateRing:** the app's signature and a precise SVG. shadcn's `Chart` (Recharts) would add weight for one ring. Its colours move to `--chart-1..4` and `--over`.
- **Bottom tab bar with the "+":** shadcn has no phone tab bar. Its tabs become `Button` `ghost` links inside it.
- **Meal and tab glyphs:** our own drawings, used through each component's icon slot.

### Other screens in one line each

- **Diary:** same layout as Today, with the week strip above.
- **History:** `Calendar` in a Card, the month summary as an `Item` row with the average plate, the day opening in the Drawer or Dialog.
- **Profile:** target in the plate card; form, theme and account on the table with `Separator`s.
- **Login and sign-up:** `Card` with `FieldGroup`, the wordmark above.

## Motion

Unchanged in purpose (MOTION 2): the ring grows or shrinks when food changes, and a new row highlights once. Drawer and Dialog bring their own open and close transitions. All of it respects reduced motion.

## Order of work

1. Branch, `init`, `add`; read every added file. Wire `className="dark"`, the toast host and `TooltipProvider` in the layout.
2. Tokens: map colours, pin radius and control heights, add `type-*` utilities, `--plate`, `--over` and `--chart-*` per theme colour. Delete our old `.card`, `.btn-*` and `.input` classes.
3. Shared pieces: Drawer/Dialog wrapper, toast (with Undo), Card `plate` variant.
4. Food form (Tabs, ToggleGroup, Collapsible, Field, Item for AI review).
5. Today and Diary (Card, Item, Progress, Skeleton, Empty, week-strip ToggleGroup).
6. History (Calendar with plate days).
7. Profile, login and sign-up.
8. Remove replaced components (`Sheet`, `Toast`, `CalendarMonth`, `StorageError` markup) and unused CSS.
9. Check:
   - Typecheck, lint and build.
   - No console errors; the page loads at the top.
   - No horizontal scroll at 320, 375, 768 and 1280px.
   - Every control clicked through in all four theme colours, keyboard only, and with reduced motion on.
   - Every new colour pair contrast-checked.
   - The antislop Delivery Gate as a PASS/FAIL report.
   - Then merge to `main`.

## Costs and risks

- **New dependencies:** Base UI, class-variance-authority, clsx, tailwind-merge, an icon library, react-day-picker (for Calendar) and the toast library. The app gets somewhat heavier, mostly from Calendar.
- **`init` rewrites `globals.css`:** our tokens are re-applied on top. That's why the work is on a branch.
- **Calendar customisation:** drawing plates inside react-day-picker cells needs a custom `DayButton`. If it fights the layout at 320px, the fallback is our current grid restyled with shadcn tokens.
- **Size:** most files in `src/components` and every page change. Data, API, login and storage code don't.

## Open decisions

1. **Surfaces:** "table and ceramic" warm tones as above (recommended), or keep today's exact charcoal?
2. **Primitive library:** Base UI (recommended, the skill's default) or Radix?
3. **Icon library for component internals:** the CLI's default (recommended: it only draws chevrons, close and check marks), or pick another set?
4. **History calendar:** shadcn `Calendar` with plate days (recommended), or keep our own grid and only restyle it?
