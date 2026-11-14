# 01: Admin access and an empty admin page

**What to build:** The person who runs the app can name admins in `.env.local` with `ADMIN_USERNAMES` (comma separated, case-insensitive). An admin sees an Admin link in the account section of Profile and can open `/admin`, which for now shows the page heading and a short line saying what the page is for. Everyone else sees no link, and `/admin` gives them the normal not-found page. A server-side admin check sits next to the existing session check (signed in, username listed, same-origin on changes), and every later admin route uses it. Plan: `docs/admin-page-plan.md`.

**Blocked by:** None (can start immediately)

**Status:** done (not committed)

- [x] `ADMIN_USERNAMES` is documented in `.env.example` and the README, next to `ALLOW_SIGNUP`
- [x] An admin sees the Admin link in Profile; a non-admin does not, and it isn't in the bottom bar
- [x] `/admin` renders for an admin and shows the not-found page for a non-admin (a logged-out visitor is sent to login, like every page, so `/admin` reveals nothing extra)
- [x] With `ADMIN_USERNAMES` unset or empty, nobody is an admin
- [x] Usernames match case-insensitively and ignore spaces around commas
- [x] A small test covers the admin check: listed, unlisted, different case, unset
- [x] Works in light and dark mode and at phone width; the link is keyboard reachable with a visible focus ring
