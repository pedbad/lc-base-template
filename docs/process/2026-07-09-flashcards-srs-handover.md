# Handover — Flashcards Step 2 (SRS layer)

**Date:** 2026-07-09
**Repo:** `lc-base-template` · branch `main` · in sync with `origin/main` at `57f182d`
**Prev work:** refactor findings **H1 + M1 both ✅ done** (nothing outstanding).
**This task:** build the Flashcards SRS (spaced-repetition) layer — §4.2 of
`docs/process/2026-07-08-handover.md`.

---

## Start-of-session checklist

1. `git fetch origin && git status -sb` — confirm `main` == `origin/main`, clean tree.
   Branch off main first: `git checkout -b feat/flashcards-srs main`.
2. Re-login via **Claude Desktop** if you want claude-mem recall — its OAuth token
   was stale as of 2026-07-09 (distillation may not persist otherwise).
3. Read for context (in order):
   - `docs/process/2026-07-08-handover.md` §4.2 (the task's acceptance list)
   - `src/exercises/flashcards/FlashcardsExercise.tsx` (current engine — flip,
     self-rate, direction, audio; NO persistence yet)
   - `src/exercises/flashcards/flashcards-deck.ts` + `flashcards-schema.ts`
   - `src/exercises/lib/exerciseScaffold.ts` (shared seed/reducer/reset — reuse it)

---

## Goal (acceptance criteria, from §4.2)

Add a Leitner spaced-repetition layer to the flashcards engine:

- [ ] `localStorage` Leitner scheduler (3–5 boxes), keyed **per LO + exercise**
- [ ] Due-ordering on load; a wrong answer resurfaces the card, a known one fades
- [ ] "Reset progress" control
- [ ] Graceful fallback: storage absent / corrupt / cleared → fresh deck (no crash)
- [ ] Tests for scheduler logic (pure functions) + storage edge cases

---

## Design constraints (project conventions)

- **Pure logic split out, testable.** Put the Leitner scheduler in a pure module
  (e.g. `flashcards/srs-scheduler.ts`) — box promotion/demotion, due-date calc,
  ordering — with its own `srs-scheduler.test.ts`. Mirrors the H1 pattern
  (`*-grading.ts` is pure + unit-tested; the component is wiring + render).
- **Storage is a boundary — validate it.** Wrap `localStorage` read/parse in a
  guarded module; treat stored JSON as untrusted (Zod-parse or hand-guard). On any
  parse failure → return fresh state, never throw. No silent swallow: log-and-recover.
- **Immutability.** Scheduler returns new state objects, never mutates.
- **SSR / no-window guard.** `typeof window === 'undefined'` → skip storage, run
  in-memory (same pattern line-match uses for `window`).
- **Keying.** Persist under a stable key derived from LO id + exercise id so two
  exercises / two LOs don't collide. Confirm what id is available in
  `ExerciseComponentProps` before choosing the key shape.
- **No new deps** unless justified — Leitner is a few pure functions.
- **Reuse the scaffold** for seed/reset if the deck still shuffles; the SRS due-order
  layers on top of (or replaces) the initial order — decide and document which.

## Verify after each meaningful step (CI runs these on push)

```
bun test
bun run lint
bun run build
```

Plus eyeball the flashcards card in the showcase (`/exercise-showcase.html`):
flip → self-rate wrong → card resurfaces; rate known → fades; reload → progress
persists; "Reset progress" → back to fresh; clear localStorage → no crash.

## Ship

- Conventional commits, small and focused (scheduler + tests, then storage +
  fallback, then component wiring, then showcase — roughly one concern per commit).
- Branch off `main`, PR or fast-forward per preference, keep `main` == `origin/main`.
- `<800`-line file cap; new pure logic ≥80% covered.
- Do NOT commit `.claude/tdd-guard/` (gitignored) or `graphify-out/`.

## After SRS: next features (do NOT start without asking)

§4.3 Conjugation table, then §4.4 Reading comprehension — full task lists in
`docs/process/2026-07-08-handover.md`.

---

## Paste-ready resume prompt

> Build the Flashcards Step 2 SRS layer in `lc-base-template` (§4.2 of
> `docs/process/2026-07-08-handover.md`; full recipe in
> `docs/process/2026-07-09-flashcards-srs-handover.md`). Refactor findings H1+M1 are
> done — this is feature work, not a finding. Add a Leitner spaced-repetition
> scheduler: pure `srs-scheduler.ts` (3–5 boxes, due-ordering, wrong resurfaces /
> known fades) + `localStorage` persistence keyed per LO+exercise, with a graceful
> fresh-deck fallback on absent/corrupt storage and a "Reset progress" control.
> Keep the scheduler pure and unit-tested (mirror the `*-grading.ts` pattern), treat
> stored JSON as untrusted, stay immutable, guard for no-window. Verify with
> `bun test · bun run lint · bun run build` and eyeball the flashcards card in the
> showcase after each step. Conventional commits, one concern each. Branch off `main`
> first (`feat/flashcards-srs`); confirm `main` == `origin/main` before starting.
