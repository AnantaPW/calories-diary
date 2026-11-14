# Plan: an admin page

Status: built on `shadcn-rework`, not committed. Checked in a test build with a throwaway data folder. Tickets: `.scratch/admin-page/issues/`.
Antislop mode: during (session override).

## Why

Running the app for a household or a small group needs the command line today: a forgotten password means `npm run reset-password`, turning sign-up off means editing `ALLOW_SIGNUP` and restarting, and there is no way to see who has an account or to remove one. The admin page puts those jobs in the app, for the person who runs it.

## Decided (2026-11-14)

| Question | Answer | Reason |
|---|---|---|
| Who is an admin | Usernames listed in `ADMIN_USERNAMES` in `.env.local` (comma separated, case-insensitive) | Same place as `ALLOW_SIGNUP` and `DATA_DIR`. Nothing in `users.json` changes, and nobody can make themselves admin from inside the app. |
| What an admin may see | Account details and counts only, never diary contents, profile, weight or meals | People signed up for a private diary. Counts are enough to run the app. |
| Where the page lives | `/admin`, linked from the account section of Profile, shown only to admins | The bottom bar keeps its four tabs. A non-admin gets the normal not-found page at `/admin`, so the page doesn't advertise itself. |
| Features | Statistics, account list, reset password and log out, delete account, sign-up on/off | Chosen by the owner. |

## What the page holds

One page, top to bottom, in the order the admin uses it:

1. **Statistics.** Number tiles computed from the data folder at request time: accounts, new accounts in the last 30 days, people who logged food in the last 7 days, entries logged in the last 7 days, diary files that can't be read. Every number is real and counted on the server; nothing is estimated. A "0" is shown as 0, not hidden.
2. **Sign-up.** One switch: Create account on or off. Saved in a new `data/app.json` so it lasts across restarts and needs no restart. `ALLOW_SIGNUP` in the environment stays the default until the admin flips the switch for the first time; after that the saved value wins. The page says which one is in effect.
3. **Accounts.** A list: username, admin marker, created date, last password change, entry count, last day with food logged. A diary file that can't be read shows as a row with a warning, not as a crash. Each row has two actions:
   - **Reset password:** the admin types a new password (same rules as sign-up). The account is logged out everywhere. Not offered on the admin's own row; they use Change password in Profile.
   - **Delete account:** the admin types the username to confirm. Removes the login, every session and the diary file. Cannot be undone, and the dialog says so. Not offered on the admin's own row, so the last admin can't lock themselves out.

Not included: viewing diaries, editing profiles, creating accounts for others, promoting admins from the app, audit log, search or paging (a household has a handful of accounts; add paging if a list ever passes about 50).

## Server rules

- A `requireAdmin` check next to `requireSession`: signed in, username in `ADMIN_USERNAMES`, and the same-origin check on every change. Every admin API route and the page render use it; a non-admin gets 404, not 403.
- Admin routes return only the fields above. The user's diary is read on the server to count entries and find the last logged day, and only those two values leave it.
- Writes go through the existing `updateJson` queue, so a reset or delete can't race a person's own save. Deleting reads nothing back: login removed first (the person can no longer act), then sessions, then the file.
- `scripts/reset-password.mjs` stays; it's the way in when the admin forgets their own password.

## Design read

Reading this as: an admin tool inside Calorie Diary for the one person who runs it, in the app's existing shadcn system (warm surfaces, Bricolage Grotesque, the plate identity), dial ENERGY 1 / RHYTHM 1 / MOTION 1.

| Decision | Reason |
|---|---|
| Dials all 1 | A maintenance page used a few times a month; calm and predictable beats expressive. |
| Reuse `Card`, `Item`, `Field`, `Dialog`/`Drawer` (via `Sheet`), `Empty`, `Skeleton`, `Alert`, toast | Same heights, focus rings and states as the rest of the app; no new components. |
| Focal point: the account list | It's where every action starts. Statistics sit above it as a short row of numbers, not cards with icons. |
| One accent: the theme colour on the primary button of each dialog | Destructive actions use chili (`--destructive`), never the theme colour. |
| Identity motif: numbers set like the Today page's plate totals (`type-focal` scale, tabular figures) | Ties the page to the app without decoration. |
| No new icons | Text labels on actions; an icon-only button would need a stock glyph that says nothing the word doesn't. |
| Light and dark | Uses the existing tokens, so both modes work; both get checked. |

States: the list and statistics share loading (skeletons) and error (the existing `StorageError` style with a retry). No empty state: the admin viewing the page is always one account; an account with no diary shows "Nothing logged yet". Both dialogs show inline field errors and a pending button.
