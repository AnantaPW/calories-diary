# 08 (stretch): The week plate morphs into the big plate

**What to build:** In the Diary, picking a day in the week strip makes that day's small plate grow and move into the big plate card while the old day's plate fades out, using the browser's View Transitions where supported. Browsers without it just swap instantly, as today. Motion purpose: "you can see which day you opened". Same idea may later apply to History's calendar day opening its detail, but that is out of scope here.

**Blocked by:** 02 (The plate draws in, the Remaining number rolls)

**Status:** done (not committed; morph seen only as calls and end state, pane was hidden)

- [ ] Selecting a day in the week strip animates the small plate into the big plate in about 300ms on supporting browsers; no animation and no error elsewhere
- [x] The entrance draw from ticket 02 does not replay on a day switch
- [x] Rapid clicks across days never leave a stuck or doubled plate; the URL date and shown day always match
- [ ] Keyboard selection (arrow keys in the strip) behaves the same as clicks
- [ ] Reduced motion: instant swap
