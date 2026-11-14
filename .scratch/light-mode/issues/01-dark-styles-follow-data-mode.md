# 01: Dark styles follow a data-mode attribute

**What to build:** Prep work so the app can have more than one mode. Today dark styling is switched on by `class="dark"` on the page, which the shadcn components' `dark:` styles key off. Move that to a `data-mode` attribute on `<html>` (set by the server, like `data-accent`) and remap the `dark:` variant to it. The variant must also match when `data-mode="system"` and the device prefers dark, so later tickets need no component edits. Only `dark` is ever rendered in this ticket, so nothing looks different.

**Blocked by:** None (can start immediately)

**Status:** done (not committed)

- [x] The `dark` class is gone; `<html>` carries `data-mode="dark"` from the server
- [x] Every shadcn `dark:` style still applies (buttons, inputs, tabs, radio group, select, drawer, calendar look exactly as before)
- [x] The `dark:` variant also matches `data-mode="system"` under `prefers-color-scheme: dark` (check by forcing the attribute in devtools)
- [x] No visual change on Today, Diary, History, Profile, login and sign up
