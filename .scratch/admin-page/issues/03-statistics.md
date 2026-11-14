# 03: Statistics

**What to build:** A short row of numbers above the account list, counted on the server from the data folder at request time: accounts, new accounts in the last 30 days, people who logged food in the last 7 days, entries logged in the last 7 days, and diary files that can't be read. Every number is real; a zero is shown as 0. Numbers use the same type style as the totals on Today, with no icons. Reuses the per-account summary from 02.

**Blocked by:** 02 (Account list)

**Status:** done (not committed)

- [x] Each number matches a hand count on a seeded data folder (`seed-demo`: 20 entries in the last 7 days)
- [x] "Last 7 days" and "last 30 days" use the same local-date rules as the rest of the app
- [x] Unreadable files are counted, not skipped silently
- [x] Loading and error states match the account list
- [x] Wraps cleanly at phone width; readable in both modes (text contrast at least 4.5:1)
- [x] A test covers the counting with dates on both sides of each cut-off
