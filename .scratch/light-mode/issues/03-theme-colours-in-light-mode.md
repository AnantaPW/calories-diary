# 03: All seven theme colours in light mode

**What to build:** Every theme colour works in light mode. Each gets the deeper light partner from `docs/light-mode-plan.md` (the dark pastels fail on a light page), with white button text. Amber (over target) and chili (remove) get their light values. The meal arcs on the plate stay distinct from each other and readable: in light mode they tint toward the plate instead of toward ink, stopping where each arc keeps 3:1 against the plate. The Theme colour swatches in Profile show the colour as it will look in the current mode, and the lists of values in CSS and the theme module stay in step.

**Blocked by:** 02 (Light, Dark or System choice in Profile)

**Status:** done (not committed)

- [x] All 7 theme colours in light mode: at least 4.5:1 on the table and white button text at least 4.5:1 on the colour (record the measured numbers in a CSS comment like the dark ones)
- [x] Amber and chili in light mode pass 4.5:1 on table, board and plate
- [x] Meal arcs 1 to 4 each have at least 3:1 on the plate in every theme colour, and stay distinguishable next to each other
- [x] Profile swatches show the light colours in light mode and the dark ones in dark mode, including while previewing a mode change
- [x] Over-target plate and remove buttons read correctly in light mode
- [x] Dark mode values are unchanged
