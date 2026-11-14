# 05: Logged-out pages and browser chrome follow the mode

**What to build:** Everything outside the signed-in pages matches too. Login, sign up and not found follow the device setting (System). The phone browser bar colour has a light and a dark value, following the mode. The light favicon, app icon and illustrations exist already but use cream `#f6f2ea`; recolour them to the stone and porcelain palette and make sure each illustration shows its light version in light mode wherever it's used.

**Blocked by:** 02 (Light, Dark or System choice in Profile)

**Status:** done (not committed; not checked on a real phone)

- [x] Login, sign up and not found render light on a light device and dark on a dark device, with no flash
- [x] Browser bar colour matches the table colour in each mode (check on a phone or with device emulation)
- [x] Favicon switches with the device's scheme; light icons and illustrations use the plan's palette, not cream
- [ ] Illustrations in use show their light version in light mode. Not applicable yet: no page uses the illustrations. The favicon follows the device, not the saved mode (a browser limit).
