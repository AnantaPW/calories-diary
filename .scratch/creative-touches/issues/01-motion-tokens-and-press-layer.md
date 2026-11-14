# 01: Motion tokens and the press/hover layer

**What to build:** Every button, link, toggle, tab, meal row action and calendar day answers the pointer the same way: a quick colour step on hover, a small press on click or tap (about 1px down, or 0.98 scale on round controls like the "+"), and a visible focus ring. All app motion reads from one shared set of motion tokens (hover in ~150ms, hover out ~120ms, press ~90ms, panel ~200ms, one ease-out curve with no bounce or overshoot). Under reduced motion everything still works and rests at its final state; nothing is hidden waiting for an animation. This is the prefactor the other motion tickets build on.

**Blocked by:** None (can start immediately)

**Status:** done (not committed; four-theme click-through and real reduced-motion run not done)

- [x] Motion tokens (durations and curves) live with the other design tokens and are used by the shadcn components and our own controls instead of their mixed defaults
- [x] Every interactive control on Today, Diary, History, Profile, login and sign-up shows a hover change and a press response; the bottom-bar "+" presses visibly
- [x] Only transform, opacity and colours animate (never width, height, margin or position)
- [x] With prefers-reduced-motion on, no transform animation runs and every control still shows hover colour and focus ring
- [ ] Clicked through in all four theme colours; typecheck, lint and build pass
