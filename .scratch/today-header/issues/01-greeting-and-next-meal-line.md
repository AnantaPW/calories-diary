# 01: Greeting and next-meal line

**What to build:** The Today header greets the person by time of day and tells them which meal comes next, instead of the plain "Today" title. It reads "Morning, {username}" (5:00–10:59), "Afternoon, {username}" (11:00–15:59), "Evening, {username}" (16:00–21:59) or "Late one, {username}" (22:00–4:59), using the device's local hour. Under it: the date, then the meal line: "Breakfast is next", "Lunch is next", "Dinner is next" for the meal of that time window, or "{Meal} logged" once that meal has entries; late night reads "Snacks count toward today". The name is the account username. With no username, the comma and name are dropped. The header shows in the loading and error states too, and keeps its height so nothing jumps when the date arrives.

**Blocked by:** None (can start immediately)

**Status:** done (not committed; build not run because a dev server holds .next)

- [x] Greeting and meal line follow the hour windows above, checked at each boundary hour
- [x] Meal line switches to "{Meal} logged" when the current window's meal has entries
- [x] Username shows after the greeting; no username drops the comma and name; a long or email-style username doesn't break the layout
- [x] Header renders the same in loading, error and loaded states without a layout jump
- [x] Greeting is the page's h1 (screen readers still land on it as the page title)
- [ ] Typecheck, lint and build pass (typecheck, src lint and tests pass; build not run)
