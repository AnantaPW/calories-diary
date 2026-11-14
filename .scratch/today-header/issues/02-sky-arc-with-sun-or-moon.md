# 02: Sky arc with sun or moon

**What to build:** Above the greeting, a thin strip of sky sits on the table: a dotted arc with a flat horizon line under it. The existing sun meal glyph sits on the arc at the current hour (left at sunrise, top at midday, right at evening), drawn in the theme colour. In the late-night window it turns into the moon glyph. Arc dots and horizon use the border colour. No card or background block behind it, so the plate stays the brightest surface. The arc is decorative and hidden from screen readers; the greeting already says the time of day.

**Blocked by:** 01 (Greeting and next-meal line)

**Status:** done (not committed; build not run because a dev server holds .next)

- [x] Glyph position on the arc matches the current hour; moon shows from 22:00 to 4:59
- [ ] Glyph follows the theme colour in all theme colours, in light and dark mode (uses the theme token; only light + herb seen)
- [x] Spans full width on phone (about 40px tall) and fits the wider desktop layout without horizontal scroll
- [x] Arc and glyph are aria-hidden
- [ ] Typecheck, lint and build pass (typecheck, src lint and tests pass; build not run)
