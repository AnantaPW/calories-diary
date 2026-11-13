# Plan: a less plain look

Status: implemented on 2026-11-13 with the recommended answers (calm screens with bold focal elements, Bricolage Grotesque for display, global "+" log button). The week strip moved its arrows to their own row so the days fit at 320px.
Antislop mode: during (session override).

## Why it looks plain now

Looking at the screens as they are:

- **Every surface is the same card.** Today, Diary, History and Profile are stacks of identical charcoal boxes with the same border, radius and padding, so nothing feels more important than anything else except the one big number.
- **One typeface, one weight range.** Geist does everything, from the wordmark to labels. There is no typographic voice.
- **The colour barely appears.** The accent shows up only as a 3px line and the primary button. The screens read as grey on grey.
- **The data is shown, not drawn.** The day's calories are a single bar; meals are lists. Nothing gives a picture of the day at a glance.
- **The main action is far away.** Logging food, the thing you do most, is a button on Today and Diary only.

The dark theme, contrast, mobile layout and behaviour are good and stay. This is a visual layer on top, not a rebuild.

## Design Read

Reading this as: a personal food diary used several times a day on a phone, in a warm, modern "kitchen at night" style with one strong data picture per screen, dial **ENERGY 2 → 3 on focal moments only / RHYTHM 2 / MOTION 2**.

- **ENERGY:** stays 2 overall (it's opened at every meal, it must not shout), but each screen's focal element goes up to 3: bigger, more colour, more character.
- **RHYTHM 2:** screens share one system; the focal element on each screen breaks the card grid on purpose.
- **MOTION 2 (up from 1):** two purposeful moments only, listed under Motion below. Everything else stays still.

## The new identity: "the plate"

One motif, used everywhere data appears: **a ring, like the rim of a plate, filled by what you ate.**

- On **Today** it's large: a ring split into arcs, one per meal (breakfast, lunch, dinner, snacks), each arc as long as that meal's calories. The empty part of the rim is what's left. The remaining number sits in the middle.
- In **History**, every logged day gets a small plate around its date number, so a month reads as a row of plates: fuller or emptier, amber when over.
- On **Diary**, each day in the new week strip (below) gets a tiny plate too.
- When the day goes **over target**, the rim closes and a second, amber arc runs outside it for the extra, so "over" is shown by shape, not only colour.

It replaces the thin fill line as the app's signature. It's specific to a food diary (a plate, filled by meals), carries real information, and nothing about it is decoration.

### Colour of the arcs

- Meals use **tints of the theme colour** (full colour, then 25% and 50% toward the text colour, and so on), not new hues, so the palette stays one core colour + amber.
- I checked the alternative, darker shades of the accent: they drop to 2.85:1 against the card and fail the 3:1 minimum for graphics. Lighter tints stay well above it.
- Arcs are separated by small gaps and each meal is labelled in the list beside or below the ring, so the meals are told apart by position and label, not colour alone.
- Every theme colour (green, blue, lavender, rose) gets its tints automatically.

## Typography

- **Display face for headings and the focal numbers:** Bricolage Grotesque (Google Fonts, free). It has a slightly hand-made, friendly character with real weight contrast, which fits a food diary better than another neutral sans. It isn't one of the default AI picks (Inter, Geist, Space Grotesk).
- **Body and every other number:** Geist stays, for its even-width digits in lists and tables.
- The big numbers must not jump in width as they change. If Bricolage's digits aren't even-width, the focal number falls back to Geist in a heavy weight. I'll check this first.
- The wordmark "Calorie Diary" is set in the display face. No logo is created.
- Clearer size steps: focal number about 56 to 72px, page title 28 to 32px, section titles 18px, body 15 to 16px.

## Surfaces and depth

- **Focal card gets a tint:** the one most important card on each screen gets a surface mixed with 10% of the theme colour. Measured: muted text on it is 5.26:1 (green) and 5.22:1 (rose), body text 11.41:1 or more. Every other card stays neutral, so the tint marks importance.
- **Fewer boxes:** secondary groups (empty meals, legends, account details) drop their card and sit on the page with a divider, so the remaining cards matter more.
- **Radius steps:** 24px for the focal card, 16px for normal cards, 10px for inputs and buttons. No pills.
- **No glow, glass, grids, noise or gradients.** Depth comes from tone steps only; the bottom sheet keeps the only shadow.

## Screen by screen

### Today

- **Top:** the plate ring, about 240px on phones and 280px on laptops, in the tinted focal card. Inside: "Remaining", the number, "of 1,900 kcal".
- **Below the ring:** protein, carbs and fat as three short horizontal bars with grams, so macros are drawn too, not just listed.
- **Meals:** one row per meal with its glyph (below), its arc colour as a small dot that matches the ring, total kcal and the foods. Empty meals are a single line with "Add".
- **Laptop:** ring and macros on the left, meals on the right.

### Log food, from anywhere

- A **round "+" button in the middle of the bottom bar** on phones (and in the top bar on laptops) opens the Add food sheet from any tab, preselecting the meal by time of day.
- Logging is the most frequent action, so it should be one tap away on every screen, not only Today and Diary.
- The Today and Diary buttons stay as well.

### Meal glyphs

Four hand-drawn glyphs in the same square-ended stroke as the nav icons: **sunrise** (breakfast), **high sun** (lunch), **moon** (dinner), **cup** (snacks). They mark the time of day each meal belongs to.

### Diary

- **Week strip** at the top replaces the date field row: seven day buttons (Mon to Sun), each with its date and a tiny plate. Swipe or arrows move by week. A calendar button opens the native date picker for far dates.
- The selected day's plate ring sits above the meals, same as Today.
- After adding food, the new item's row gets a brief highlight so you can see where it went.

### History

- Month grid keeps its layout; each logged day's date sits inside a small plate ring (about 32px on phones, 40px on laptops). Over-target days show the amber outer arc.
- Month summary becomes one tinted strip under the grid: days logged, average, days over, with the average drawn as its own small plate.
- The day sheet uses the same ring and meal rows as Today.

### Profile

- **Daily target** in the tinted focal card in the display face; the BMR to TDEE to target sum below it as a short worked line.
- Theme colour swatches become small plate previews (a ring in each colour), so you see what the colour will look like.
- Form and account sections lose their card and sit on the page with dividers.

### Login and sign-up

- Wordmark in the display face, with a single empty plate ring drawn behind it, as the one decorative element in the app. It directly shows the product's motif; nothing else is added.
- Card and form stay the same.

## Motion (MOTION 2)

Only two moments, both explaining a change:

1. **Ring fills on change:** when the day's total changes (food added or removed), the arcs grow or shrink over about 400ms, so you see where the new calories went.
2. **New item highlight:** the row of a just-added food fades from tinted to normal over about 1.5s.

Both are switched off under `prefers-reduced-motion`. Nothing loops, nothing animates on scroll or page load.

## What stays the same

- Dark warm charcoal background, all four theme colours, amber for over target, red for remove.
- Layout breakpoints, 44px tap targets, keyboard support, focus rings, all states (loading, empty, error).
- All features and data. No new pages.

## Order of work

1. **Foundations:** display font (check its digits first), type scale, radius steps, tinted focal surface, arc tints per theme colour.
2. **Plate ring component** (`PlateRing`): meal arcs with gaps, over-target outer arc, accessible label ("1,240 of 1,900 kcal: breakfast 320, lunch 650, dinner 270"), sizes from 28px to 280px.
3. **Meal glyphs** and the new meal rows.
4. **Today** rebuilt around the ring and macro bars.
5. **Global "+" log button** and the shared Add food sheet.
6. **Diary** week strip and highlight on add.
7. **History** plate days and summary strip.
8. **Profile and login** touches.
9. **Check:** typecheck, lint, build; every screen at 320, 375, 768 and 1280px in all four theme colours; keyboard only; reduced motion on; contrast of every new pair; then the antislop Delivery Gate as a PASS/FAIL report.

## Open decisions

1. **Energy:** the plan above (calm screens, bold focal elements), or bolder throughout, with the display face on every heading and tinted cards on more sections?
2. **Display face:** Bricolage Grotesque (recommended), or keep Geist everywhere and get the character from the plate ring and colour alone?
3. **Global "+" button:** in the middle of the bottom bar (recommended), or keep logging only on Today and Diary?
