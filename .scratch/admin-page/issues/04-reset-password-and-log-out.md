# 04: Reset password and log out everywhere

**What to build:** Each account row (except the admin's own) has a Reset password action. It opens the app's sheet with a new-password field that uses the same rules as sign-up. Saving sets the password and ends every session of that account, so the person logs in again with the new password. The admin's own row has no action; they use Change password in Profile. `npm run reset-password` stays for when the admin forgets their own password.

**Blocked by:** 02 (Account list)

**Status:** done (not committed)

- [x] The reset API is admin-only, same-origin only, and refuses the admin's own account
- [x] Password rules and messages are the same as sign-up; errors show under the field
- [x] After a reset, the account's old sessions no longer work and the new password logs in
- [x] The button shows a pending state; success shows a toast naming the account
- [x] The sheet closes with Escape and returns focus to the row's button; works at phone width and in both modes
- [x] A test covers: success ends sessions, own account refused, non-admin gets 404
