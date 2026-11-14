# 02: Light, Dark or System choice in Profile

**What to build:** A person can pick how the app looks: System, Light or Dark. The choice sits in Profile beside Theme colour, previews across the page as soon as it's picked (leaving without saving puts the saved one back, like Theme colour), and is saved to their account. The server renders the saved mode, and System is resolved in CSS with `prefers-color-scheme`, so the wrong theme never flashes. Accounts with no saved mode get **System**.

Light mode is the "daylight kitchen" palette from `docs/light-mode-plan.md`: stone table, board, porcelain plate, ink, smoke, border, with Herb green as the theme colour. Other theme colours, amber and red get their light values in 03. `color-scheme` follows the mode so native date pickers, selects and scrollbars match.

**Blocked by:** 01 (Dark styles follow a data-mode attribute)

**Status:** done (not committed)

- [x] Profile shows System / Light / Dark as one choice, labelled for screen readers, keyboard operable, with visible focus
- [x] Picking previews immediately; Save keeps it; leaving unsaved restores the saved mode
- [x] The settings API accepts and validates the mode and rejects unknown values; old saved data without a mode reads as System
- [x] Reloading in Light or Dark shows that mode on first paint, no flash; System follows the device and switches live when the device switches
- [x] Light mode text pairs match the plan's checked values (ink and smoke on table, board and plate pass WCAG AA)
- [x] Native controls (date input, select, scrollbars) match the mode
- [x] Dark mode is unchanged
