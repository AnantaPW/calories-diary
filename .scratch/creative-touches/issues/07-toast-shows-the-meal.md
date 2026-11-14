# 07: Toast shows the meal and what was added

**What to build:** The "Added …" toast carries the meal's glyph in its ring colour and a tiny arc showing how much of the day's target this addition took (for example a quarter-ring for 320 of 1,384 kcal), so the confirmation is readable at a glance. "Removed … Undo" shows the same glyph with the arc and keeps its Undo action. Save-error toasts stay plain text with no glyph. Still one toast at a time.

**Blocked by:** 01 (Motion tokens and the press/hover layer)

**Status:** done (not committed)

- [x] Added and Removed toasts show the meal glyph and a small arc sized to the food's share of that day's target; multi-item AI adds show the total
- [x] Undo still restores the food and closes the toast; toast still sits above the phone bottom bar
- [x] Glyph and arc are decorative; the toast text alone tells screen readers what happened
- [ ] Enters and leaves with the shared motion tokens; reduced motion shows and hides it without sliding
