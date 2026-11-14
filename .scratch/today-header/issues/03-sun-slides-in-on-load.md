# 03: Sun slides in on load

**What to build:** On the first page load, the sun (or moon) slides along the arc from the left edge to its spot for the current hour, about 600ms on the shared ease-out motion token. It runs once per visit, like the plate draw-in: switching between Today and Diary doesn't replay it. It finishes before the plate draw-in so the two don't compete. With reduced motion on, the glyph starts at its final spot.

**Blocked by:** 02 (Sky arc with sun or moon)

**Status:** done (not committed; build not run because a dev server holds .next)

- [x] Glyph travels along the arc path (not a straight line) to its spot on first load
- [x] Uses the shared motion tokens; only translate moves (driven by an animated --t number)
- [x] Doesn't replay on Today/Diary switches within one visit
- [x] With prefers-reduced-motion on, no movement; glyph rests at its final spot
- [ ] Typecheck, lint and build pass (typecheck, src lint and tests pass; build not run)
