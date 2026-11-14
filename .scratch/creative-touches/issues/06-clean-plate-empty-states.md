# 06: Clean-plate drawing for empty states

**What to build:** Empty states get one small drawing in the app's own hand-drawn glyph style: an empty plate seen from above, with a fork and knife beside it. It appears in the Empty media slot for: a past day with nothing logged (History day detail), no history yet, and the AI estimate coming back with nothing usable. Today's "nothing logged yet" keeps its one line of text under the plate (the big empty ring already says it). Each empty state keeps exactly one action that fills it.

**Blocked by:** None (can start immediately)

**Status:** done (not committed)

- [x] One drawing, same stroke weight and square ends as the existing nav and meal glyphs, drawn in the muted colour with the theme colour on the plate rim only
- [x] Shown in the three empty states above, decorative (hidden from screen readers), with the existing text and single action unchanged
- [x] No caption or label under the drawing
- [x] Fits at 320px wide without pushing the action below a fixed bar
