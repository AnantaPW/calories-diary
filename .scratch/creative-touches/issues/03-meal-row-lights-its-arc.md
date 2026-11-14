# 03: A meal row lights its arc on the plate

**What to build:** The meals card and the plate read as one picture. Hovering or keyboard-focusing a meal in the meals card lifts that meal's arc on the ring (slightly thicker or brighter) while the other arcs dim; leaving it puts the plate back. When a food is added, its meal's arc pulses once at the same moment the new row gets its one-time highlight, so the eye goes from the list to the plate. Works on phones by tapping a meal header (no hover needed to understand the app).

**Blocked by:** 01 (Motion tokens and the press/hover layer)

**Status:** done (not committed; phone tap and 4-theme contrast not checked live)

- [x] Hover or focus on a meal in the meals card highlights the matching arc and dims the others; works with keyboard Tab
- [x] Adding food from the Add food sheet pulses the right meal's arc once, together with the row highlight
- [x] Meals with no food have no arc to light and do nothing odd on hover
- [x] Works on Today, Diary and in the History day detail
- [ ] Reduced motion: highlight is an instant state change, no pulse
- [ ] Highlighted arc keeps at least 3:1 contrast against the plate surface in all four theme colours
