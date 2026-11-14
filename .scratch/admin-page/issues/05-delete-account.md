# 05: Delete account

**What to build:** Each account row (except the admin's own) has a Delete account action in the destructive colour. The dialog says that the login, sessions and whole diary will be removed and that this can't be undone, and the delete button stays disabled until the admin types the username exactly. Deleting removes the login first (so the person can't act any more), then their sessions, then the diary file. The row disappears and the statistics update.

**Blocked by:** 02 (Account list)

**Status:** done (not committed)

- [x] The delete API is admin-only, same-origin only, refuses the admin's own account, and needs the typed username to match
- [x] After a delete, that person's open pages get "Please log in again" and the username can be signed up again
- [x] A missing diary file doesn't stop the delete; a failure part way leaves the login removed and is reported, never half-hidden
- [x] The dialog closes with Escape and returns focus; works at phone width and in both modes
- [x] A test covers: success removes all three, own account refused, wrong typed name refused
