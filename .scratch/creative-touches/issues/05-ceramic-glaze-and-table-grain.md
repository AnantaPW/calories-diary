# 05: Ceramic glaze on the plate card, grain on the table

**What to build:** Make "plate on a table" felt, not only named. The focal plate card gets a soft glaze: a faint radial highlight behind the ring and a thin inner rim so the ring sits in a dish. The page background (the table) gets a very faint linen grain, so it reads as a surface rather than flat brown. Both are static (no motion) and cheap (CSS only, no images over a few KB). Ordinary cards stay flat so only the plate card stands out.

**Blocked by:** None (can start immediately)

**Status:** done (not committed; grain contrast eyeballed, not measured)

- [x] Plate card on Today, Diary, Profile (daily target) and the History month summary shows the glaze; ordinary cards do not
- [ ] Table grain is visible on a normal screen but never fights text; all text pairs on it still pass WCAG AA (recheck smoke text on table and on plate)
- [x] Works in all four theme colours (glaze may take a hint of the theme colour, never violet-tinting the green/blue/rose themes)
- [x] No horizontal scroll, no layout change, no measurable load-time cost; page still loads at the top
- [ ] Looks right at 320, 375, 768 and 1280px wide
