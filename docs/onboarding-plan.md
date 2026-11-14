# Plan: first-run setup (onboarding)

Status: built 2026-11-14 (skip, cm/kg and optional theme approved by the owner).
Antislop mode: during (no mode was picked when asked; this is a plan for new UI, so the rules are applied while planning).

## Why

A new account has `profile: null`. Today then shows a target worked out from `DEFAULT_PROFILE` (a 30-year-old, 165 cm, 65 kg woman losing weight) without saying so. The person has to find Profile, read a seven-field form and save it before the number on Today means anything. Most people never get there, so the main number in the app is quietly wrong for them.

Setup asks the same questions one at a time right after sign-up, shows the target it produces, and saves it. Profile stays the place to change things later.

## What already exists (reused, not rebuilt)

| Piece | Where | Used for |
|---|---|---|
| "Has this person set up?" | `data.profile === null` in `UserData` | The only signal. No new flag, no migration. |
| Saving | `saveProfile()` in `src/lib/client/diaryStore.ts` -> `PUT /api/profile` | Saves the profile and records the target change. No server change. |
| Validation | `parseProfile()` in `src/lib/validate.ts` (age 13-120, height 100-250, weight 30-350) | Same ranges on the inputs; the server check stays the real one. |
| Target maths and the explanation | `calculateDailyTarget`, `TargetCard` in `src/app/profile/page.tsx` | The last step shows the same card. |
| Theme | `ThemePicker` (previews live, saves on its own button) | Optional last step. |
| Labels | `ACTIVITY_LABELS`, `GOAL_LABELS` in `src/lib/calories.ts` | Same words as Profile. |

## Decided (proposed, owner to confirm)

| Question | Answer | Reason |
|---|---|---|
| Where it lives | A new page, `/welcome`, drawn as a modal card over the app | A real URL survives a reload mid-setup and can be linked from Today. The modal (owner's call, 2026-11-14) keeps the menu out of reach until people save or skip; Escape counts as Skip, a backdrop click does nothing. |
| Who sees it | Signed in and `profile === null`. Anyone else at `/welcome` is sent to `/` | One rule, decided on the server from data that already exists. |
| How people get there | After sign-up, `reloadTo("/welcome")` instead of `"/"`. People with no profile who log in later see a "Set your daily target" card on Today that links to it | New accounts land in setup. Existing accounts that never set a profile get a prompt, not a forced detour. |
| Can it be skipped | Yes, "Skip for now" goes to Today. The Today card stays until a profile is saved | Logging a meal should never wait on a form. Nothing new is stored for "skipped": the card is driven by `profile === null`. |
| Units | cm and kg, same as Profile | Adding imperial units is its own change (Profile would need it too). |

Not included: imperial units, weight goal or goal date, macro targets, meal reminders, a progress tour of the app. None of them have a field in `UserProfile` today.

## The flow

One page, one question group per step, a step counter ("Step 2 of 4") as text. Back and Next on every step; state lives in the page, so Back never loses an answer. Nothing is saved until the last step.

1. **Your goal.** Lose, maintain or gain, as a radio group (`RadioGroup`, large rows) with one line under each that says what it does to the target (-500, no change, +300 kcal). Asked first because it is why the person is here.
2. **About you.** Sex, age, height (cm), weight (kg). Same inputs and limits as Profile. Next stays enabled; pressing it with a bad value shows the field error under that field and focuses it.
3. **How active you are.** The five activity levels as a radio group, using `ACTIVITY_LABELS`.
4. **Your daily target.** The `TargetCard` (big number, BMR, activity, goal lines), plus the optional custom target field folded under "Set my own number instead". Below it, the `ThemePicker` under a "Colour and light or dark (optional)" heading. Main button: **Save and open Today**. On success, `router.push("/")` and the usual "Saved" toast. On failure, the button comes back and the existing save-error toast says what happened; the answers stay on screen.

Copy for the buttons: "Next: about you", "Next: activity", "Show my target", "Save and open Today", "Skip for now". No generic "Get started".

## Code changes

| File | Change |
|---|---|
| `src/components/TargetCard.tsx` | Moved out of `src/app/profile/page.tsx` unchanged, so both pages import it. |
| `src/app/welcome/page.tsx` | Server component: no session -> `/login`; `profile` already set -> `/`; otherwise renders the client form. |
| `src/components/WelcomeSteps.tsx` | The four steps. Starts from `DEFAULT_PROFILE` values for the selects only; number fields start empty so nobody saves the defaults by accident. |
| `src/components/AuthForm.tsx` | `reloadTo(signup ? "/welcome" : "/")`. |
| `src/lib/client/navigate.ts` | Widen `reloadTo`'s path type to include `"/welcome"`. |
| `src/app/page.tsx` | When `profile === null`, show a short card above the summary: "Your target is a placeholder until you set it up" with a link button "Set your daily target" to `/welcome`. `useProfile()` needs to expose whether a profile is saved (`hasProfile`). |
| `src/hooks/useDiary.ts` | Add `hasProfile` to `useProfile()`. |

No API, storage or validation changes.

## Design read

Reading this as: a four-step first-run setup inside Calorie Diary for someone who just made an account, in the app's existing shadcn system (warm surfaces, Bricolage Grotesque headings, the plate identity), dial ENERGY 2 / RHYTHM 1 / MOTION 1.

| Decision | Reason |
|---|---|
| ENERGY 2 | It is the first screen a new person sees; the question headings use the `type-title` scale and the final number uses `type-focal`, a little louder than a settings form. |
| RHYTHM 1 | Every step has the same shape (heading, one group, Back/Next) so people know where to look. |
| MOTION 1 | No step animations. Focus moves to the new step's heading on Next/Back so keyboard and screen-reader users land in the right place. |
| Focal point per step | The question heading on steps 1-3; the target number on step 4. |
| One accent | The theme colour on the main button only. |
| Identity motif | The target shown in the same plate card as Profile, so the number people meet first is the one they will see every day. |
| No icons or illustrations | Text rows say it; a stock glyph per goal would add nothing. |
| Layout | Single column, `max-w-xl`, on every breakpoint. The bottom tab bar stays (Skip is always one tap away anyway). Back/Next sit in a row that stays on screen above the tab bar on phones. |

States: the page renders from the server so there is no loading state for the steps; saving shows a pending button; a save error keeps the answers and shows the existing error toast. Light and dark both use existing tokens and both get checked.

## Checks before calling it done

- Unit test for the one new bit of logic: the step validator (which step a bad value belongs to, and that an empty number field blocks Next).
- In the browser, both themes, phone and desktop width: sign up -> lands on `/welcome`; Back keeps answers; empty age shows an error and focuses it; Save -> Today shows the new target and no setup card; reload `/welcome` after saving -> redirected to `/`; a pre-existing account with no profile -> card on Today -> link opens setup; Skip -> Today with the card; keyboard-only run through all four steps.
- Profile page still saves and shows the same `TargetCard` after the move.
