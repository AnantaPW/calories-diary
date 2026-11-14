# 02: Account list

**What to build:** The admin page lists every account: username, an admin marker, created date, last password change, number of diary entries and the last day with food logged. The server reads each diary only to count entries and find the last logged day; no diary contents, profile or weight leave the server. A diary file that can't be read shows as a row with a warning instead of breaking the list. The per-account summary is a server helper that ticket 03 reuses.

**Blocked by:** 01 (Admin access and an empty admin page)

**Status:** done (not committed)

- [x] The list API is admin-only (non-admins get 404) and returns only the fields above
- [x] An account with no diary file shows 0 entries and "Nothing logged yet"
- [x] An unreadable diary file shows a warning row; the other rows still show
- [x] Loading shows skeleton rows; a failed request shows an error with a retry
- [x] The list reads well at phone width (no horizontal scroll) and in both modes
- [x] A test covers the summary helper: normal file, missing file, unreadable file
