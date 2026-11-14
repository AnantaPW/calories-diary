# 02: The plate draws in, the Remaining number rolls

**What to build:** The app's one entrance moment. When Today or Diary first shows a day's plate in a visit, the meal arcs draw around the rim from empty to their share in about one second, one after another in meal order, and the Remaining number counts to its value with even-width digits so nothing jumps. After that, when food is added or removed, the arcs grow or shrink (already the case) and the Remaining number rolls from the old value to the new one. Motion purpose: "the plate fills as you look at it, so the day reads as eating, not a form". Over target, the amber outer arc draws last.

**Blocked by:** 01 (Motion tokens and the press/hover layer)

**Status:** done (not committed; reduced motion not run live, "visit" = page load)

- [x] First view of the plate in a browser session draws the arcs and rolls the number once; moving between Today and Diary in the same visit does not replay it
- [x] Adding or removing a food rolls the Remaining number from old to new; "Remaining" / "Over by" switches cleanly when the day tips over
- [x] The screen-reader description of the plate states the final numbers immediately, never mid-animation values
- [ ] Reduced motion: arcs and number appear at their final values with no animation
- [x] No layout shift while the number rolls (tabular digits, fixed width)
