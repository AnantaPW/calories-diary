# Plan: username/password login, JSON file storage, theme colours

Status: implemented on 2026-11-12 with the recommended answers (open sign-up with ALLOW_SIGNUP switch, accent colours only, reset command, browser import notice).
Antislop mode: during (session override).

## What changes for the user

- Opening the app shows a **Log in** page. New people use **Create account** (username + password, nothing else).
- After logging in, everything works as now, but the diary, profile, target history and AI input belong to that account and live in JSON files on the machine running the app, not in the browser.
- Profile gets a **Theme colour** setting. The choice is saved to the account, so it follows the person to any browser.
- Profile also gets **Change password** and **Log out**.

## 1. Where the data lives

### Folder

- Set by `DATA_DIR` in `.env.local`. Absolute paths are used as-is; relative paths resolve from the project root.
- Default when unset: `./data` in the project workspace (what development uses).
- `data/` is added to `.gitignore` so accounts and diaries never get committed.
- The folder is created on first start if missing.

### Files

```
data/
├── users.json             # accounts: id, username, password hash, created date
├── sessions.json          # active logins: hashed token, user id, expiry
└── users/
    └── <user-id>.json     # one file per person: profile, target history, entries, settings
```

One file per person keeps each write small and means one person's data can be backed up, moved or deleted on its own.

Example `users/<user-id>.json`:

```json
{
  "version": 1,
  "profile": { "sex": "female", "age": 30, "heightCm": 165, "weightKg": 65, "activity": "light", "goal": "lose" },
  "targets": [{ "from": "", "target": 1384 }],
  "entries": [{ "id": "…", "date": "2026-11-12", "meal": "dinner", "name": "Nasi goreng", "calories": 550, "createdAt": "…" }],
  "settings": { "accent": "green" }
}
```

The shapes are the ones the app already uses (`FoodEntry`, `UserProfile`, `TargetChange`), so the pages barely change.

### Writing safely

- **No half-written files:** every save writes to a temporary file in the same folder, then renames it over the old one. A crash mid-save leaves the previous version intact.
- **No lost updates:** saves to the same file go through a per-file queue, so two quick changes (add food, then undo) can't overwrite each other.
- **Unreadable file:** if a JSON file can't be parsed, the server refuses to write over it and the app shows the existing "couldn't be read" message instead of starting fresh.
- **File permissions:** files are created readable only by the owner (mode 600) on macOS and Linux. Windows ignores this; there, the folder's own permissions apply.

### Limits to know

- Runs on **one server process** with a real disk (`npm run dev` or `npm run build` + `npm start` on your own machine or a VPS). Hosts like Vercel have no lasting disk, so data would vanish there.
- Fine for a person or a household. It isn't meant for many people writing at once; if it grows, `lib/server/store.ts` is the single place to swap in a database.

## 2. Login and security

No new packages: everything below uses Node's built-in `crypto`.

### Accounts

- **Username:** 3 to 32 characters, letters, numbers, `_` and `-`. Unique regardless of upper or lower case.
- **Password:** at least 8 characters, at most 128. No forced symbols or digits; length matters more. Common passwords like `password1` are rejected with a short built-in list.
- **Storage:** passwords are hashed with **scrypt** (built into Node) with a random 16-byte salt per account. The plain password is never written anywhere, including logs.
- **Checking:** hashes are compared with `timingSafeEqual`. A login for a username that doesn't exist still runs one scrypt hash, so response time doesn't reveal which usernames exist.

### Sessions

- On login the server makes a random 32-byte token, stores only its **SHA-256 hash** in `sessions.json`, and sends the token in a cookie. If someone reads `sessions.json`, they can't log in with what's in it.
- Cookie settings: `HttpOnly` (scripts can't read it), `SameSite=Lax`, `Secure` in production, `Path=/`.
- Sessions last 30 days and are extended on use (at most once a day, to limit writes). Log out deletes the session on the server, not just the cookie.
- Changing the password ends every other session for that account.
- Expired sessions are cleaned out of `sessions.json` when it is next written.

### Attacks this covers

| Risk | Defence |
|---|---|
| Guessing passwords | After 5 failed logins for one username, or 20 from one address, within 15 minutes, further attempts wait. The message says how long. Kept in memory, so a restart clears it. |
| Finding which usernames exist | Same message for a wrong username or password: "Username or password is incorrect." Sign-up has to say a name is taken; that's acceptable for this app. |
| Forged requests from other sites | `SameSite=Lax` cookie, plus every request that changes data must carry an `Origin` header matching the app. |
| Reading another person's data | Every data request looks up the user from the session on the server. The user id in file paths always comes from the session, never from the request, so `../` tricks can't reach other files. |
| Bad input | Every API checks types, lengths and ranges before saving (e.g. calories 0 to 10,000, names up to 80 characters, at most 200 entries per day). |
| Running up the DeepSeek bill | `/api/estimate` requires a login and is limited to 30 estimates per user per hour. |

### What protects which route

- **Pages:** `src/proxy.ts` (Next 16's new name for middleware) sends anyone without a session cookie to `/login`. This is only a fast first check, as Next's own guidance says.
- **Data:** the real check is in a small data access layer (`lib/server/session.ts`, `verifySession()`), called by every API route and server action. A forged cookie gets a 401 there.

### Sign-up

Open decision, see the end. Recommended: sign-up is on by default and can be switched off with `ALLOW_SIGNUP=false` once everyone in the household has an account.

### Forgotten password

There's no email, so there's no reset link. Plan: a command run on the machine that holds the data, which sets a new password for a username:

```bash
npm run reset-password -- <username>
```

It prompts for the new password and ends that account's sessions.

## 3. Moving the app from browser storage to the server

### API routes (all require a session)

| Route | Does |
|---|---|
| `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout` | Account and session handling |
| `POST /api/auth/password` | Change password (needs the current one) |
| `GET /api/me` | The signed-in person's username and their whole data file |
| `POST /api/entries`, `DELETE /api/entries/[id]` | Add (one or many, for AI input's split items) and remove food |
| `PUT /api/profile` | Save profile; records the target change on the server |
| `PUT /api/settings` | Save theme colour |
| `POST /api/import` | One-time import of entries saved in this browser (below) |

### Client side

- `hooks/useDiary.ts` keeps its current shape (`entries`, `addEntry`, `removeEntry`, `restoreEntry`, `profile`, `targetFor`, `loaded`, `error`), so the Today, Diary, History and Profile pages need almost no changes.
- Underneath, the localStorage store in `lib/storage.ts` is replaced by one that loads `/api/me` once and sends each change to the API.
- Changes show immediately and are saved in the background. If a save fails, the change is rolled back and a toast says "Couldn't save. Check your connection and try again."
- Undo after delete re-adds the same entry (same id), so it works the same as today.

### Data already in this browser

The diary currently lives in `localStorage`. After someone logs in for the first time, if this browser has saved entries, Today shows a one-line notice:

> "This browser has 23 diary entries from before accounts. **Add them to your account** · **Leave them**"

Adding them imports entries, profile and target history (skipping any already present), then clears them from the browser. Leaving them keeps them where they are and hides the notice.

## 4. Login and sign-up pages

Same dark theme and type as the rest of the app. One narrow card, centred, nothing else on the page: no marketing, no illustrations.

- The text wordmark "Calorie Diary" above a single card.
- **Log in:** Username, Password (with a Show button), **Log in** button, and below it "No account yet? **Create account**".
- **Create account:** Username (rules shown under the field), Password (minimum length shown, live "8 of 8 characters" style hint), Confirm password, **Create account** button, and "Already have an account? **Log in**".
- Errors appear under the field they belong to, plus a summary at the top read out by screen readers.
- While submitting, the button reads "Logging in…" and is disabled so it can't be sent twice.
- Inputs use `autocomplete="username"`, `"current-password"` and `"new-password"` so password managers work.
- No bottom tab bar on these pages.
- Phone: the card fills the width with the usual 16px gutter. 44px fields and buttons.

## 5. Theme colour

### What changes

Only the **main colour**: the one used for progress lines, the primary button, the active tab and links. Everything that carries meaning stays fixed in every theme:

- **Amber** always means "over target".
- **Red** always means "remove".
- The warm charcoal background and text stay the same.

That's why there is no orange or red option: it would blur "over target" and "remove".

### Options (checked for contrast with the antislop checker)

| Option | Main colour | On cards (needs 4.5:1) | Button text on it |
|---|---|---|---|
| Herb green (default) | `#5CC98A` | 7.36:1 | 9.15:1 |
| Sky blue | `#6AB0F3` | 6.59:1 | 8.20:1 |
| Lavender | `#B9A3F5` | 6.95:1 | 8.65:1 |
| Rose | `#F29BBE` | 7.38:1 | 9.18:1 |

"On cards" is measured on the lightest surface (`#27261F`), so the darker ones pass by a wider margin. I also tried a teal (`#4FC7C2`, 7.43:1) and left it out because it's too close to the green to feel like a different choice.

### Profile settings

- A **Theme colour** section with four large swatches (each 44px or more, with its name written under it, so it doesn't rely on colour alone).
- Picking one previews it straight away across the page; **Save** keeps it, and leaving without saving restores the old one.
- It works as a radio group: arrow keys move between swatches, the chosen one has a check mark and a visible ring.

### How it's applied

- Each option is a block of CSS variables in `globals.css`, e.g. `[data-accent="blue"] { --color-brand: #6ab0f3; --color-brand-strong: …; }`. The Tailwind classes already read these variables, so no component changes.
- The root layout reads the signed-in person's choice on the server and puts `data-accent` on `<html>`, so the right colour is there on first paint with no flash of green.

## 6. Order of work

1. **Storage layer:** `lib/server/store.ts` (read, safe write, per-file queue, `DATA_DIR`), `.gitignore`, `.env.example`.
2. **Auth core:** `lib/server/auth.ts` (scrypt hash/verify, sessions, rate limiter), `lib/server/session.ts` (`verifySession`), `src/proxy.ts`.
3. **Login and sign-up pages** with their auth routes and all states.
4. **Data API** and the server-backed `useDiary` store; protect `/api/estimate`.
5. **Browser data import** notice and route.
6. **Profile:** theme colour, change password, log out. Theme variables and server-side `data-accent`.
7. **Reset-password command** and README section on `DATA_DIR`, sign-up and backups.
8. **Check:**
   - Typecheck, lint, build.
   - Two accounts in two browsers: each sees only their own data; a hand-edited cookie gets a 401.
   - Wrong password 5 times shows the wait message; logout ends the session server-side.
   - A file corrupted by hand shows the error and is not overwritten.
   - Kill the server mid-save: the file is still valid JSON.
   - Each theme at 375px and 1280px, keyboard only.
   - Then the antislop Delivery Gate as a PASS/FAIL report.

## Open decisions

1. **Sign-up:** open with an `ALLOW_SIGNUP=false` switch (recommended), or only the first account can sign up and others are added with a command?
2. **Theme options:** accent colour only, as above (recommended), or also a light mode? A light mode means a second full set of checked colours.
3. **Forgotten password:** the reset command (recommended), or also let a signed-in person delete their own account from Profile?
4. **Existing browser data:** offer the import notice (recommended), or start every account empty?
