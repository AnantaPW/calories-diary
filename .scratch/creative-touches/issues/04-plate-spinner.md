# 04: Plate spinner for every loading state

**What to build:** Waiting looks like the app, not a stock icon. A small plate rim with a short theme-colour arc travelling around it replaces the generic spinner in buttons (Estimate with AI, Log in, Create account, Change password, Log out, import) and replaces the grey circle in the Today/Diary loading placeholder, where a large empty rim slowly fills and empties until the day loads. The rest of the loading placeholder (macro bars, meal rows) stays as skeleton shapes.

**Blocked by:** 01 (Motion tokens and the press/hover layer)

**Status:** done (not committed; arc travels round the rim rather than filling and emptying)

- [x] One plate-spinner component used everywhere a spinner showed before; it keeps a status role and an accessible "Loading" name where the old one had it
- [x] Inside buttons it sits at icon size and the button stays disabled while busy
- [x] The Today and Diary loading placeholder shows the large rim instead of a flat grey circle, same size as the real plate so nothing jumps when data arrives
- [ ] Reduced motion: a still partial rim, no rotation
- [x] Loop cycle stays between 1 and 3 seconds; nothing spins after loading ends
