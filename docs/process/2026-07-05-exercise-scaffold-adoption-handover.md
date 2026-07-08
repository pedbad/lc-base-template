# Handover — M1 exercise-scaffold adoption

**Date:** 2026-07-05 (adoption completed 2026-07-08)
**Audit finding:** M1 (shared exercise scaffold)
**Status:** ✅ **DONE** — shared unit shipped & merged, and all four target engines
migrated onto `useExerciseScaffold` (2026-07-08, `feat/scaffold-adoption`,
one commit each: `select` `0f1dd20`, `inline-choice` `5b3f263`,
`radio-quiz` `1beecba`, `line-match` `238011b`). `seedFromId` local defs: 0 left.
The runbook + recipe below are retained as historical reference.

---

## What was done today

### 1. M1 shared scaffold — created and merged

A new lib unit extracts the repeated, non-engine-specific wiring the exercise
engines each carried:

- **File:** `src/exercises/lib/exerciseScaffold.ts` (+ `exerciseScaffold.test.ts`, 10 tests)
- **Merged:** `main` via PR #2 (commit `7ff7e55`, `refactor(exercises): extract shared blank-grading scaffold into lib`)

Exports:

| Symbol                                                        | Kind      | Purpose                                                                                                   |
| ------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| `seedFromId(id: string): number`                              | pure fn   | FNV-1a hash of `useId` → stable uint32 seed (no `Math.random`)                                            |
| `ExercisePatch<S>`                                            | type      | `Partial<S> \| null \| (s => Partial<S> \| null)`                                                         |
| `createExerciseReducer<S>()`                                  | factory   | merge-patch reducer; **null patch = no-op returning same ref** (line-match's measure-after-render settle) |
| `ExerciseScaffold<S>`                                         | interface | `{ state, dispatch, reset }`                                                                              |
| `useExerciseScaffold<S extends { seed: number }>(buildRound)` | hook      | `seed(useId)` + `useReducer(buildRound)` + `reset()` that rebuilds with `seed + 1`                        |

**Design boundary:** the scaffold owns ONLY the repeated wiring. It does **not**
grade and does **not** render — both stay per engine.

### 2. Deliberate pause (ordering with H1)

Per-engine adoption was paused to avoid editing the same `.tsx` files as **H1**
(per-engine grading extraction into `*-grading.ts`). Shared-unit creation was
new-file-only, so it merged with zero conflict.

### 3. H1 has since merged — blocker gone

`main` now has 11 `*-grading.ts` files (PRs #1 + #3). Engines already import
their grading fns (e.g. `select` imports `gradeSelect`, `fillSelectAnswers` from
`./select-grading`). The scaffold adoption is now **unblocked**.

---

## Current state / what remains

✅ **Complete as of 2026-07-08.** All four `seedFromId` engines now consume
`useExerciseScaffold` (`select`, `inline-choice`, `radio-quiz`, `line-match`), one
commit each, behavior identical (313 tests · lint · build green after each). No local
`seedFromId` defs remain.

`inline-gap` and `text-entry` still carry a local merge reducer **only** — they have no
`seed`, so they cannot take `useExerciseScaffold` (`S extends { seed: number }`). A
follow-up could point them at `createExerciseReducer` alone; out of scope for M1.

_Original remaining-work note (historical):_ adopt `useExerciseScaffold` / `seedFromId` /
`createExerciseReducer` in the blank-grading engines, **one engine per commit**, behavior
identical.

### Adoption targets (blank-grading family)

Current sizes for scope:

| Engine                                   | Lines | Has local `seedFromId`? | Has local merge reducer?   |
| ---------------------------------------- | ----- | ----------------------- | -------------------------- |
| `select/SelectExercise.tsx`              | 296   | yes                     | yes                        |
| `radio-quiz/RadioQuizExercise.tsx`       | 284   | yes                     | yes                        |
| `inline-choice/InlineChoiceExercise.tsx` | 277   | yes                     | yes                        |
| `line-match/LineMatchExercise.tsx`       | 559   | yes                     | yes (null-bailout variant) |
| `inline-gap/InlineTypedGapExercise.tsx`  | 338   | no                      | yes                        |
| `text-entry/TextEntryRuntime.tsx`        | 235   | no                      | yes                        |

Start with **`select`** or **`radio-quiz`** — cleanest, seed-based shape.
`line-match` last (heaviest; uses the null-patch no-op + extra `buildRound` args).

**Out of scope for the hook:** `word-order` (sequence/placement family — `failCount`/
`complete`, no `seed`). It may still adopt `seedFromId` alone if it ever seeds.

---

## Per-engine migration recipe

For one engine, in one commit:

1. Delete the local `const seedFromId = …` and the local merge reducer; import
   `seedFromId`, `useExerciseScaffold` (and `ExercisePatch` if the engine types
   its patch) from `@/exercises/lib/exerciseScaffold`.
2. Replace the `useId` + `useReducer(reducer, …, () => buildState(seedFromId(uid)))`
   block with:
   ```ts
   const { state, dispatch, reset } = useExerciseScaffold((seed) =>
     buildState(items, options, seed),
   );
   ```
   Ensure `buildState` still puts the given `seed` on returned state.
3. Replace `handleReset = () => dispatch(prev => buildState(…, prev.seed + 1))`
   with the hook's `reset`. Wire `onReset={reset}` in the footer.
   - `line-match`: its `buildRound` also needs viewport; wrap:
     `useExerciseScaffold((seed) => buildRound(items, sampleSize, seed, isDesktopNow()))`.
     Keep `stopRecoil()` before reset — call it inside a local `handleReset`
     that then calls `reset()`.
4. Leave grading (`gradeX`/`fillX` from `*-grading.ts`), render, `handleCheck`,
   `handleShowAnswers`, status line, and `canRevealAnswers` untouched.
5. Verify behavior identical.

### Verify after EACH engine (CI runs these on push — `.github/workflows/ci.yml`)

```
bun test
bun run lint
bun run build
```

Plus eyeball the showcase for that engine (Check → wrong → Show-answers → Reset,
and re-shuffle-on-reset when `options.shuffle` is on).

### Constraints

- Conventional commits, one engine per commit.
- <800-line file cap; keep new pure logic ≥80% covered (scaffold pure logic
  already covered — engine edits are wiring, no new pure logic expected).
- Do not commit `.understand-anything/` (gitignored).

---

## ⚠️ Coordinate — unpushed flashcards on a separate work machine

A **flashcards** engine was built on a separate work computer, **not yet
committed/pushed**. That machine is behind `main` (missing H1 + M1 merges).
Before broad refactor churn:

- Land (or branch+PR) the flashcards first, OR
- Confirm flashcards is a new engine dir (no overlap with the 6 targets above)
  and sequence around it.
  Low collision risk (new dir), but rebase the work machine onto current `main`.

---

## Continue prompt (paste to resume)

> Resume audit finding **M1** on `lc-base-template`: adopt the shared exercise
> scaffold in the engines. The shared unit already shipped and merged
> (`src/exercises/lib/exerciseScaffold.ts`, exports `seedFromId`,
> `createExerciseReducer`, `useExerciseScaffold`); **H1 grading extraction is also
> merged** (`*-grading.ts` present), so per-engine edits are unblocked.
>
> No engine consumes the scaffold yet. `seedFromId` is still duplicated 4×
> (select, inline-choice, radio-quiz, line-match) and the merge reducer 6×
> (+ inline-gap, text-entry). Refactor these blank-grading engines onto
> `useExerciseScaffold` + `seedFromId`, **one engine per commit**, following the
> recipe in `docs/process/2026-07-05-exercise-scaffold-adoption-handover.md`.
> Start with `select` (cleanest), do `line-match` last (null-patch no-op + extra
> buildRound args). Keep grading/render/check/show-answers per engine — touch only
> the scaffold wiring. Behavior must stay identical: after each engine run
> `bun test`, `bun run lint`, `bun run build` and confirm the showcase behaves the
> same. Conventional commits. Branch off `main` first.
>
> Note: an unpushed **flashcards** engine exists on a separate work machine —
> confirm no overlap before broad churn.

---

## Monday runbook — land the flashcards (run ON THE WORK MACHINE)

The flashcards engine was built on a separate work computer and is **uncommitted +
unpushed**. That machine is behind `main` (missing H1 + M1 + this handover). Do this
FIRST, before any scaffold-adoption work, to secure it and rebase onto current `main`.

### Step 0 — secure it immediately (before anything else)

```bash
cd <repo>                       # the lc-base-template clone on the work machine
git status                      # confirm the flashcard files are listed
git checkout -b feat/flashcards-engine
git add -A
git commit -m "feat: add flashcards exercise engine"
git push -u origin feat/flashcards-engine   # now off local disk — safe
```

### Step 1 — rebase onto current `main`

```bash
git fetch origin
git rebase origin/main
```

Expected clean (flashcards is a new dir). If conflicts appear — only likely in shared
glue (`lazyRegistry.ts`, `exercise-types.ts`, the instructions map, showcase fixtures):

```bash
git status                      # see conflicted files
# edit: keep BOTH the flashcards registration AND main's existing entries
git add <file>
git rebase --continue
```

Bail out anytime with `git rebase --abort` — the Step 0 commit stays safe.

### Step 2 — verify (CI runs these on push; run locally first)

```bash
bun install                     # main may have added deps
bun test
bun run lint
bun run build
```

### Step 3 — land it

```bash
git push --force-with-lease     # rebase rewrote history; safe force
gh pr create --base main --title "feat: flashcards exercise engine" --body "New flashcards engine."
gh pr merge --squash --delete-branch
```

### Step 4 — then start the scaffold refactor on fresh `main`

```bash
git checkout main && git pull
git checkout -b refactor/scaffold-select
```

Then follow the **Continue prompt** above (adopt `useExerciseScaffold` + `seedFromId`,
`select` first, one engine per commit).
