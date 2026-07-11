# Handover — Reading Comprehension (engine §4.4)

**Date:** 2026-07-11
**Repo:** `lc-base-template` · branch `main` · in sync with `origin/main` at `062cbdb`
**Prev work:** §4.2 Flashcards SRS ✅ · §4.3 Conjugation table (typed v1) ✅ — both
merged to `main` and pushed. Nothing outstanding except two parked follow-ups (below).
**This task:** build the **Reading comprehension** engine — §4.4 of
`docs/process/2026-07-08-handover.md`, design §6 of
`docs/specs/2026-07-03-new-exercise-engines-design.md`. This is the LAST new engine
in the Phase C roadmap.

---

## ⚠️ tdd-guard gotcha — READ FIRST

This repo runs **`bun test`**. The global `tdd-guard` plugin only ingests results
from a **jest/vitest reporter**, so it NEVER sees bun output and will block EVERY
implementation write (schema, grading, component) as "premature — no failing test",
no matter how you cycle Red→Green.

- Pure-logic files (schema/grading) can be coaxed through with the stub dance
  (write test → run → throwing stub → run → real logic), but it is slow and costly.
- **View/component files (`.tsx`) get blocked outright.**

**At session start, send exactly:** `tdd-guard off` (wait for "TDD Guard disabled").
Re-enable at the end with `tdd-guard on` if you want. Consider disabling the plugin
globally for bun projects — it cost ~$60 of thrash last session.

---

## Start-of-session checklist

1. `git fetch origin && git status -sb` — confirm `main` == `origin/main`, clean tree.
   Branch off main first: `git checkout -b feat/reading-comprehension main`.
2. Send `tdd-guard off` (see gotcha above).
3. Read for context (in order):
   - `docs/specs/2026-07-03-new-exercise-engines-design.md` §6 (the design)
   - `docs/process/2026-07-08-handover.md` §4.4 (the acceptance list)
   - `src/exercises/radio-quiz/` — **reuse its question unit + grading**
     (`radio-quiz-schema.ts` exports `RadioQuizQuestionSchema`, `parseStarredOptions`;
     `radio-quiz-grading.ts` for the per-question scoring)
   - `src/exercises/conjugation/` — freshest example of the full engine shape
     (schema + pure grading + thin view + fixture + wiring), built last session
   - `src/exercises/inline-gap/InlineTypedGapExercise.tsx` — footer/ResultSlot/scoring wiring

---

## Goal (acceptance criteria, §4.4 + design §6)

Blank-grading family, **composite** (embeds question sub-widgets):

```
{ passage, questions: [{ type: 'radio' | 'true-false', prompt, options?, answer }], instructions? }
```

- [ ] `exercise-types.ts` — `reading` key (add its `EXERCISE_INSTRUCTIONS` copy in the
      **same commit** — the exhaustive Record is a tsc error otherwise, by design)
- [ ] `reading/reading-schema.ts` — Zod for the shape above + `instructionsField`
- [ ] `reading/ReadingExercise.tsx` — lang-tagged passage + stacked questions, each
      reusing the radio-quiz question unit; aggregate blank-grading across questions;
      standard Check / Reset / Show-answers footer
- [ ] **v1 = MCQ + true/false only.** Short-answer (typed) questions parked.
- [ ] `lang={TARGET_LANG}` on the passage (and target-language question text)
- [ ] `lazyRegistry.ts` register · `instructions.ts` copy · `reading.fixture.ts` (Spanish)
- [ ] `showcase/fixtures.ts` — import + spread the fixture into the manifest
- [ ] `exercise-types.test.ts` — add `'reading'` to the expected key list
- [ ] Tests (pure grading ≥80%) + tsc/build + showcase a11y verify

---

## Design constraints (project conventions)

- **Reuse, don't re-derive.** The per-question radio grading already exists in
  `radio-quiz-grading.ts` — aggregate over it; do not hand-roll option matching.
  `true-false` is a two-option radio (True/False) — model it as such, not a new widget.
- **Pure logic split out, testable.** Put aggregate scoring in a pure
  `reading-grading.ts` with its own `reading-grading.test.ts`. Mirror
  `conjugation-grading.ts` / `inline-gap-grading.ts`.
- **Thin view.** `ReadingExercise.tsx` = passage render + question list + footer wiring
  over the pure grader. No grading logic in the component.
- **Spanish fixtures.** The whole showcase is Spanish (TARGET_LANG). Do NOT ship French
  or English demo content — that was a bug last session. Passage + questions in Spanish.
- **Immutability, no-window safety, `lang={TARGET_LANG}`** on target-language content only.
- **`<800`-line file cap;** many small files over few large ones.
- **Component tests** use `renderToStaticMarkup` from `react-dom/server` (repo has NO
  jsdom/RTL harness) — see `conjugation/ConjugationExercise.test.tsx` for the pattern.

## Verify after each meaningful step (CI runs these on push)

```
bun test
bun run lint
bun run build
```

Plus eyeball the reading card in the showcase (`/exercise-showcase.html`): passage
renders lang-tagged; pick answers; Check marks per-question + aggregate score; a wrong
answer keeps Show-answers available; Show-answers reveals all; Reset clears.

## Ship

- Conventional commits, small and focused (schema + grading + tests, then component,
  then wiring + fixture — roughly one concern per commit).
- Branch off `main` (`feat/reading-comprehension`); fast-forward or PR per preference.
- Do NOT commit `.claude/tdd-guard/` (gitignored) or `graphify-out/`.

## After reading: parked follow-ups (do NOT start without asking)

1. **§4.3 v2 — conjugation choice mode.** Schema already supports
   `answerMode: 'choice'` + per-row `options[]`; only the view path is unbuilt. Wire the
   tap-a-button path reusing the radio-quiz option unit. `ConjugationExercise.tsx`
   currently renders a "choice mode not available yet" notice for such configs.
2. Any Phase C wrap-up / cross-engine polish.

---

## Paste-ready resume prompt

> Build the Reading comprehension engine (§4.4) in `lc-base-template` — design §6 of
> `docs/specs/2026-07-03-new-exercise-engines-design.md`, full recipe in
> `docs/process/2026-07-11-reading-comprehension-handover.md`. It's the last new engine
> in Phase C. FIRST send `tdd-guard off` (this repo uses bun test, which tdd-guard can't
> read, so it blocks every impl write otherwise). Branch off `main`
> (`feat/reading-comprehension`); confirm `main` == `origin/main` first. Content shape:
> `{ passage, questions:[{type:'radio'|'true-false', prompt, options?, answer}],
instructions? }`. v1 = MCQ + true/false only (short-answer parked). Reuse the
> radio-quiz question unit + `radio-quiz-grading.ts` — aggregate scoring in a pure
> `reading-grading.ts` (unit-tested, mirror `conjugation-grading.ts`); thin
> `ReadingExercise.tsx` view over it with the standard Check/Reset/Show-answers footer;
> lang-tag the passage with TARGET_LANG. Ship SPANISH showcase content (the showcase is
> Spanish — no French/English). Wire `exercise-types` key + instructions copy (same
> commit), `lazyRegistry`, `reading.fixture.ts`, the showcase manifest, and add
> `'reading'` to `exercise-types.test.ts`. Verify `bun test · bun run lint · bun run
build` and eyeball the card in the showcase after each step. Component tests via
> `renderToStaticMarkup` (see conjugation). Conventional commits, one concern each.
