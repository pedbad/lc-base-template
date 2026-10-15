# Browser tests — slice E12b design: exercise flows, and axe in open states

**Date:** 2026-10-15 · **Status:** built 2026-10-15 (`bbd0637`, `6737464`, `c6c3d3f`); one WebKit-only axe exclusion, §7
**TODO:** §E12b · **Builds on:**
[`2026-10-14-browser-tests-design.md`](2026-10-14-browser-tests-design.md) (E12a)
· **Plan:** [`2026-10-15-exercise-flows-axe-plan.md`](../process/2026-10-15-exercise-flows-axe-plan.md)

## 1. Why

E12a proved each page loads clean and passes axe, but only as loaded: the exercises sit
in closed `<details>`, so axe never measured them, and no test ever pressed Check. The
learner's real path (answer, check, change an answer, give up and reveal, start again)
and every overlay (the popup modal, a select's dropdown, a hover card) were untested in
a browser. Dark mode has never been checked by axe at all.

## 2. Scope

**In:** `select` and `radio-quiz` flows on `example.html`; axe with every accordion
open, with each popup modal open, with a select dropdown open and with the hover card
open, each in light and dark; the closed pages in dark. Chromium, Firefox and WebKit,
at `/` and `/course/`, in the existing CI job.

**Out:** the other thirteen engines (E12c needs a `DEBUG=1` build), narrow viewports
(chosen against, 2026-10-15), audio playback, and a per-question verdict for screen
readers (see §7).

## 3. Files

| File                          | Holds                                                                      |
| ----------------------------- | -------------------------------------------------------------------------- |
| `e2e/support.ts` (new)        | Shared helpers, moved out of `pages.spec.ts` and `choice-keyboard.spec.ts` |
| `e2e/exercise-flows.spec.ts`  | The two flows and the Tab/Shift+Tab path                                   |
| `e2e/axe-open-states.spec.ts` | axe with things open, light and dark                                       |
| `e2e/pages.spec.ts`           | Unchanged behaviour; imports its helpers from `support.ts`                 |
| `e2e/choice-keyboard.spec.ts` | Unchanged behaviour; opens the quiz through `openExercise()`               |

`support.ts` exports `WCAG_TAGS`, `watchForProblems()`, `animationsSettled()`,
`expectNoAxeViolations()` and `openExercise(page, headingId)`. `openExercise` clicks the
accordion's summary and waits for its open animation (the WebKit lost-click lesson in
`choice-keyboard.spec.ts`). The two exercise heading ids live in one exported constant,
because they depend on the render-mirror folder names (`01-select`, `02-radio-quiz`).

## 4. The flows (`exercise-flows.spec.ts`)

Both exercises set `shuffle: true`, so an option is always chosen **by its label**,
never by position; `select` also shuffles its rows, so a row is found by its sentence.
State is read the way a learner or a screen reader meets it: `aria-checked`, button
names and visibility, and the progress line (`role="status"`, "{correct} correct out of
{total}"). No CSS class is asserted.

**radio-quiz** (question 1's answer is "Buenos días", question 2's is "martes"):

1. **Start:** no pill checked; Check disabled; no Reset; no Show answers.
2. **Answer and check:** "¡Hola!" for 1, "martes" for 2, Check. Status reads "1 correct
   out of 2"; question 1's explanation is visible, question 2's is not; Show answers
   appears.
3. **Edit:** change 1 to "Buenos días". Its explanation disappears at once (the verdict
   is cleared). Check: "2 correct out of 2", Show answers gone.
4. **Reveal:** wrong answer, Check, Show answers. Each correct option is checked, no
   explanation shows, Show answers is gone.
5. **Reset:** after a check, Reset. Back to step 1's state.

**select** (answers: "soy", "eres", "es", one per sentence): the same five steps, with
one wrong option chosen in one sentence. A blank is found by its sentence (the row's grid, then its one `combobox`), opened, and
an option chosen with `getByRole('option', { name })`; the shown value is read from the
trigger's `lang` span.

**Keyboard path, from nothing selected** (radio-quiz): Tabbing on from the accordion
summary, the first pill to take focus is question 1's first pill; Tab again lands on question 2's first pill, not on
question 1's second (roving tab stop); Shift+Tab returns to question 1.

**Waits.** Every interaction that starts an animation (opening an accordion, a select's
popup, the modal) is followed by an auto-waiting condition, never a sleep:
`animationsSettled()` covers page load only, so each new animation gets its own wait.

## 5. axe in open states (`axe-open-states.spec.ts`)

One `describe` per colour scheme, with `test.use({ colorScheme })`. The theme follows
`prefers-color-scheme` when nothing is stored (`index.html`'s inline script), so
emulation needs no app change. Each case: set the state, wait for animations, run axe
with the E12a tags, expect no violations.

| Case                    | How it is opened                                                    |
| ----------------------- | ------------------------------------------------------------------- |
| `index.html`, dark only | as loaded (light is already in `pages.spec.ts`)                     |
| `example.html`, dark    | as loaded                                                           |
| every accordion open    | click each closed `<summary>` on `example.html`                     |
| example popup open      | click "open the example popup"; wait for `role="dialog"`            |
| conjugation popup open  | click "open the conjugation popup"; wait for `role="dialog"`        |
| select dropdown open    | open the select exercise, click a blank's trigger; wait for listbox |
| hover card open         | focus the hover term; wait for its `aria-expanded="true"`           |

Light runs the five open-state rows only: both pages as loaded in light are already in
`pages.spec.ts`.

## 6. Proving the tests can fail

The flows test code that works, so they pass from the start. Each is seen to fail once
against a deliberate break, then the break is reverted (never committed): Reset that
keeps the selection, a Show answers that never appears, an explanation that stays after
an edit. For axe, a planted contrast break in dark mode only (a `.dark` rule) must fail
the dark pass and not the light one.

## 7. When a check finds a real problem

A violation is fixed in its own `fix:` commit on this branch; the failing spec is its
test. A fix larger than a few lines, or one that changes the design, stops the job and
goes to the maintainer. Known and out of scope: the per-question tick or cross is
`aria-hidden`, so a screen reader hears only the progress line's count, not which
question was wrong. axe does not flag it (nothing is wrong per WCAG's automated rules);
it is noted for a later decision, not fixed here.

**Found while building (2026-10-15):** in WebKit, with a Base UI popup open (the
Dialog, a Select's dropdown), Base UI's focus-guard sentinels are nameless
`role="button"` spans, given that role in Safari for VoiceOver's sake, and axe reports
`aria-command-name`. The markup is Base UI's and no prop names it. **Maintainer's
decision:** leave `[data-base-ui-focus-guard]` out of axe in WebKit only, with the reason
beside the exclusion in `e2e/support.ts`; it is already reported upstream as
[mui/base-ui#5237](https://github.com/mui/base-ui/issues/5237). Recheck on every Base UI
upgrade.

## 8. Done when

- The three spec files pass in all three browsers, locally at `/` and in CI at `/` and
  `/course/`.
- Each flow was seen failing against a planted break, and the dark pass against a
  planted dark-only contrast break.
- `docs/TOOLING.md` "Browser tests" names the new specs; TODO §E12b is marked done.
