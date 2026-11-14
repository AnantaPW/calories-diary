# 06: Sign-up on/off

**What to build:** The admin page has a switch for Create account. The choice is saved in a new `data/app.json` and takes effect right away, with no restart: the sign-up page and sign-up API follow it, and the login page's link to sign up hides when it's off. Until the admin uses the switch for the first time, `ALLOW_SIGNUP` from the environment decides, and the page says which source is in effect.

**Blocked by:** 01 (Admin access and an empty admin page)

**Status:** done (not committed)

- [x] The setting API is admin-only and same-origin only
- [x] With no `data/app.json`, behaviour matches today's `ALLOW_SIGNUP` rules
- [x] After flipping the switch, the saved value wins over the environment, and survives a restart
- [x] An unreadable `data/app.json` falls back to the environment and shows a warning; it is never overwritten
- [x] The switch is a real labelled control, keyboard operable, with pending and error states; works in both modes and at phone width
- [x] A test covers: no file, saved on, saved off, unreadable file
