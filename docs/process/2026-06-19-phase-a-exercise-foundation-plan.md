# Phase A — Exercise Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the pure, React-free foundation the 12 exercise engines depend on —
canonical type keys, the shared `options` schema, and three shared pure utilities
(scoring, shuffle, reveal-gate) — each proven with `bun test`.

**Architecture:** Phase A ships only dependency-free TypeScript. No React, no routing,
no engine. Every piece here is consumed by the first engine (`select`) in Phase B, so
nothing is speculative. The React shell/hook, `lazyRegistry`, `answerNormalize`,
parsing/diff helpers, and the showcase page are deferred to Phase B, where their
interfaces get fixed against a real consumer.

**Tech Stack:** TypeScript, Zod v4, Bun (`bun test`), Vite. Verify gate per task:
`bun run format · bun run lint · bun test · bun run build` (no CSS touched, so
`lint:css` is unaffected).

**Source spec:** `docs/specs/2026-06-19-exercise-engines-design.md` (§4 config anatomy,
§5 behavior contract, §6 options schema, §7 scoring families). Builds on Step-13a
schemas in `src/config/lo-schema.ts`.

---

## File structure (Phase A)

| File                                    | Responsibility                                                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/config/exercise-types.ts`          | The canonical list of 12 kebab `type` keys + `ExerciseType` type. Lives in `config/` because it is part of the config contract; engines (Phase B) import it. |
| `src/config/lo-schema.ts` (modify)      | Tighten `ExerciseConfigSchema.type` to a Zod enum of the 12 keys; add `ExerciseOptionsSchema` and wire optional `options`.                                   |
| `src/config/lo-schema.test.ts` (modify) | Update the one case using a non-enum type; add unknown-type + options tests.                                                                                 |
| `src/exercises/lib/scoring.ts`          | Pure blank-grading scoring helpers (ported from french-lo-1).                                                                                                |
| `src/exercises/lib/shuffle.ts`          | Pure seeded shuffle + sampleN (immutably returns new arrays).                                                                                                |
| `src/exercises/lib/reveal.ts`           | Pure `canRevealAnswers` predicate — the show-after-wrong-check rule, family-agnostic.                                                                        |

Dependency direction: `src/exercises/*` may import from `src/config/*`, never the
reverse.

---

## Task 1: Canonical exercise type keys

**Files:**

- Create: `src/config/exercise-types.ts`
- Test: `src/config/exercise-types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/config/exercise-types.test.ts
import { test, expect } from 'bun:test';
import { EXERCISE_TYPE_KEYS } from './exercise-types';

test('exercise-types: exactly the 12 canonical kebab keys', () => {
  expect(EXERCISE_TYPE_KEYS).toEqual([
    'select',
    'inline-choice',
    'radio-quiz',
    'inline-gap',
    'typed-transform',
    'dictation',
    'word-order',
    'phrase-reorder',
    'drag-fill-gaps',
    'line-match',
    'memory-match',
    'word-spot',
  ]);
});

test('exercise-types: no duplicate keys', () => {
  expect(new Set(EXERCISE_TYPE_KEYS).size).toBe(EXERCISE_TYPE_KEYS.length);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/config/exercise-types.test.ts`
Expected: FAIL — `Cannot find module './exercise-types'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/config/exercise-types.ts
/**
 * exercise-types.ts — the canonical set of exercise engine keys.
 *
 * The 12 interactive exercise types ported from french-lo-1, in kebab-case
 * (spec §2). This is the single source of truth for valid exercise `type`
 * values: `lo-schema.ts` builds its Zod enum from it, and the `lazyRegistry`
 * (Phase B) keys its engine map by it. Adding an engine = add its key here.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2.
 */
export const EXERCISE_TYPE_KEYS = [
  'select',
  'inline-choice',
  'radio-quiz',
  'inline-gap',
  'typed-transform',
  'dictation',
  'word-order',
  'phrase-reorder',
  'drag-fill-gaps',
  'line-match',
  'memory-match',
  'word-spot',
] as const;

/** A valid exercise engine key. */
export type ExerciseType = (typeof EXERCISE_TYPE_KEYS)[number];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/config/exercise-types.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
bun run format && bun run lint && bun test && bun run build
git add src/config/exercise-types.ts src/config/exercise-types.test.ts
git commit -m "feat: add canonical exercise type keys (phase A)"
```

---

## Task 2: Options schema + type enum in lo-schema

**Files:**

- Modify: `src/config/lo-schema.ts`
- Modify: `src/config/lo-schema.test.ts`

Context — the current Step-13a `lo-schema.ts` shares one `partEnvelope` between
blocks and exercises, with `type: z.string().min(1)`. This task makes the exercise
schema diverge (as the spec anticipated): exercise `type` becomes a Zod enum of the
12 keys, and an optional shared `options` block is added. Blocks keep a free-string
`type` (block types like `grammar`/`vocabulary` are not exercise keys).

- [ ] **Step 1: Update the existing test that uses a non-enum type, and add new tests**

In `src/config/lo-schema.test.ts`, the "content is loose" case currently uses
`type: 'fill-gaps'`, which is **not** a canonical key (`drag-fill-gaps` is). Change it:

```ts
// REPLACE this test body's type value:
test('lo-schema: content is loose — extra keys are preserved', () => {
  const parsed = ExerciseConfigSchema.parse({
    type: 'drag-fill-gaps', // was 'fill-gaps'
    content: { sentence: 'a __ c', answers: ['b'] },
  });
  expect((parsed.content as { answers: string[] }).answers).toEqual(['b']);
});
```

Then add these tests at the end of the file (and extend the import line to include
`ExerciseOptionsSchema`):

```ts
// extend the existing import:
import {
  LoManifestSchema,
  BlockConfigSchema,
  ExerciseConfigSchema,
  ExerciseOptionsSchema,
} from './lo-schema';

// Guard: type must be one of the 12 canonical keys — a stray string is rejected.
test('lo-schema: exercise rejects an unknown type key', () => {
  expect(() => ExerciseConfigSchema.parse({ type: 'fill-gaps', content: {} })).toThrow();
});

// Options block is optional; when present, defaults fill in.
test('lo-schema: options defaults shuffle=false, allowShowAnswers=true', () => {
  const parsed = ExerciseConfigSchema.parse({
    type: 'select',
    content: {},
    options: {},
  });
  expect(parsed.options?.shuffle).toBe(false);
  expect(parsed.options?.allowShowAnswers).toBe(true);
  expect(parsed.options?.sampleSize).toBeUndefined();
});

// Options is per-instance: two exercises of the same type can differ.
test('lo-schema: options carries per-instance shuffle + sampleSize', () => {
  const parsed = ExerciseConfigSchema.parse({
    type: 'select',
    content: {},
    options: { shuffle: true, sampleSize: 5 },
  });
  expect(parsed.options).toEqual({ shuffle: true, sampleSize: 5, allowShowAnswers: true });
});

// Guard: sampleSize must be a positive integer.
test('lo-schema: options rejects non-positive sampleSize', () => {
  expect(() => ExerciseOptionsSchema.parse({ sampleSize: 0 })).toThrow();
});

// Block type stays a free string (grammar/vocabulary are not exercise keys).
test('lo-schema: block type accepts a non-exercise string', () => {
  expect(() => BlockConfigSchema.parse({ type: 'grammar', content: {} })).not.toThrow();
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `bun test src/config/lo-schema.test.ts`
Expected: FAIL — `ExerciseOptionsSchema` is not exported; unknown-type test fails
because `type` is still a free string that accepts `'fill-gaps'`.

- [ ] **Step 3: Edit `src/config/lo-schema.ts`**

Add the import near the top (after the `ui-strings` import):

```ts
import { EXERCISE_TYPE_KEYS } from './exercise-types';
```

Replace the `partEnvelope` + `BlockConfigSchema` + `ExerciseConfigSchema` block
(everything from `const partEnvelope = {` through the `ExerciseConfig` type export)
with:

```ts
/**
 * Shared behavior switches for ANY exercise (spec §5/§6). One shape for all 12
 * engines; every field optional; VALUES are set per instance, so two exercises of
 * the same `type` can behave differently (one shuffled, one not). Reset and the
 * show-after-wrong-check reveal are implicit (always on), so they are not fields.
 */
export const ExerciseOptionsSchema = z.object({
  /** Randomize presented choices (default off; author opts in). Reset re-shuffles when on. */
  shuffle: z.boolean().default(false),
  /** Show a random N of M choices; omit = show all. Positive integer. */
  sampleSize: z.number().int().positive().optional(),
  /** false removes the Show-answers control entirely (e.g. a pure game). */
  allowShowAnswers: z.boolean().default(true),
});
export type ExerciseOptions = z.infer<typeof ExerciseOptionsSchema>;

/**
 * Validates one content block's `block.json` (grammar, vocabulary, …). Block `type`
 * is a free string — block kinds are not in the exercise registry.
 */
export const BlockConfigSchema = z.object({
  type: z.string().min(1),
  labels: UiStringsOverrideSchema.optional(),
  content: z.looseObject({}),
});
export type BlockConfig = z.infer<typeof BlockConfigSchema>;

/**
 * Validates one exercise's `exercise.json`. `type` MUST be one of the 12 canonical
 * keys (an unknown key fails the build); `options` is the shared behavior block;
 * `content` stays loose here (per-type shape lands when that engine is ported).
 */
export const ExerciseConfigSchema = z.object({
  type: z.enum(EXERCISE_TYPE_KEYS),
  labels: UiStringsOverrideSchema.optional(),
  content: z.looseObject({}),
  options: ExerciseOptionsSchema.optional(),
});
export type ExerciseConfig = z.infer<typeof ExerciseConfigSchema>;
```

Also update the file header's SCOPE NOTE line about `type` — change "resolved to the
one shared engine via `lazyRegistry` (step 14)" wording is fine, but add after it:
"`type` is now a Zod enum of the 12 canonical keys (`exercise-types.ts`)."

- [ ] **Step 4: Run tests to verify all pass**

Run: `bun test src/config/lo-schema.test.ts`
Expected: PASS (original cases + 5 new = all green).

- [ ] **Step 5: Commit**

```bash
bun run format && bun run lint && bun test && bun run build
git add src/config/lo-schema.ts src/config/lo-schema.test.ts
git commit -m "feat: add exercise options schema + type enum (phase A)"
```

---

## Task 3: Scoring helpers

**Files:**

- Create: `src/exercises/lib/scoring.ts`
- Test: `src/exercises/lib/scoring.test.ts`

Ported from french-lo-1's `exerciseScoring.js` (the blank-grading family: select,
inline-choice, radio-quiz, inline-gap, typed-transform, dictation, line-match).
Pure functions; scoring state lives in each engine's reducer (Phase B).

- [ ] **Step 1: Write the failing test**

```ts
// src/exercises/lib/scoring.test.ts
import { test, expect } from 'bun:test';
import { getInitialScoringState, countCorrect, commitCheck } from './scoring';

test('scoring: initial state is empty, unchecked, zero correct', () => {
  expect(getInitialScoringState()).toEqual({
    checkedResults: {},
    hasChecked: false,
    nCorrect: 0,
  });
});

test('scoring: getInitialScoringState returns a fresh object each call', () => {
  const a = getInitialScoringState();
  const b = getInitialScoringState();
  expect(a.checkedResults).not.toBe(b.checkedResults); // not a shared mutable map
});

test('scoring: countCorrect counts only true values', () => {
  expect(countCorrect({ 0: true, 1: false, 2: true })).toBe(2);
  expect(countCorrect({})).toBe(0);
  expect(countCorrect()).toBe(0);
});

test('scoring: commitCheck marks checked and derives nCorrect', () => {
  const results = { 0: true, 1: false };
  expect(commitCheck(results)).toEqual({
    checkedResults: results,
    hasChecked: true,
    nCorrect: 1,
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/exercises/lib/scoring.test.ts`
Expected: FAIL — `Cannot find module './scoring'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/exercises/lib/scoring.ts
/**
 * scoring.ts — shared scoring helpers for the blank-grading exercise family
 * (select, inline-choice, radio-quiz, inline-gap, typed-transform, dictation,
 * line-match). Ported from french-lo-1's exerciseScoring.js.
 *
 * Grading is modeled as a `checkedResults` map (blank/row key -> correct?) plus
 * `hasChecked` and a derived `nCorrect`. The grading FUNCTION (option-index vs
 * normalized-typed vs identity match) differs per engine and stays in each engine;
 * only these three shared fields + the count derivation live here. The scoring
 * fields stay inside each engine's single merge reducer (atomic updates with
 * input/diff state) — they are not lifted into a separate store.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7.
 */
export interface ScoringState {
  checkedResults: Record<string | number, boolean>;
  hasChecked: boolean;
  nCorrect: number;
}

/**
 * Fresh baseline for the scoring fields. A FACTORY (not a shared constant) so each
 * reset gets its own `checkedResults` object — a shared constant would hand every
 * exercise the same mutable map.
 */
export const getInitialScoringState = (): ScoringState => ({
  checkedResults: {},
  hasChecked: false,
  nCorrect: 0,
});

/** Number of correct blanks/rows in a checkedResults map. */
export const countCorrect = (checkedResults: Record<string | number, boolean> = {}): number =>
  Object.values(checkedResults).filter(Boolean).length;

/**
 * The "commit a check" patch: record per-blank results, mark checked, derive
 * nCorrect. Callers spread exercise-specific siblings (diffResults, values, …)
 * alongside it in their reducer.
 */
export const commitCheck = (checkedResults: Record<string | number, boolean>): ScoringState => ({
  checkedResults,
  hasChecked: true,
  nCorrect: countCorrect(checkedResults),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/exercises/lib/scoring.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
bun run format && bun run lint && bun test && bun run build
git add src/exercises/lib/scoring.ts src/exercises/lib/scoring.test.ts
git commit -m "feat: port blank-grading scoring helpers (phase A)"
```

---

## Task 4: Shuffle + sample utilities

**Files:**

- Create: `src/exercises/lib/shuffle.ts`
- Test: `src/exercises/lib/shuffle.test.ts`

Implements the `options.shuffle` and `options.sampleSize` behavior (spec §5.2, §6).
Immutable (returns new arrays, never mutates input — coding-style). A seedable RNG
makes tests deterministic and lets a future reset reproduce or vary order.

- [ ] **Step 1: Write the failing test**

```ts
// src/exercises/lib/shuffle.test.ts
import { test, expect } from 'bun:test';
import { mulberry32, shuffle, sampleN } from './shuffle';

test('shuffle: preserves length and multiset (no items lost or added)', () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffle(input, mulberry32(42));
  expect(out).toHaveLength(5);
  expect([...out].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
});

test('shuffle: does not mutate the input array', () => {
  const input = [1, 2, 3];
  const snapshot = [...input];
  shuffle(input, mulberry32(7));
  expect(input).toEqual(snapshot);
});

test('shuffle: same seed gives the same order (deterministic)', () => {
  const a = shuffle([1, 2, 3, 4, 5], mulberry32(99));
  const b = shuffle([1, 2, 3, 4, 5], mulberry32(99));
  expect(a).toEqual(b);
});

test('sampleN: returns at most n items, all from the input', () => {
  const out = sampleN([1, 2, 3, 4, 5], 3, mulberry32(1));
  expect(out).toHaveLength(3);
  out.forEach((x) => expect([1, 2, 3, 4, 5]).toContain(x));
});

test('sampleN: n larger than length returns all items', () => {
  const out = sampleN([1, 2], 10, mulberry32(1));
  expect(out).toHaveLength(2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/exercises/lib/shuffle.test.ts`
Expected: FAIL — `Cannot find module './shuffle'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/exercises/lib/shuffle.ts
/**
 * shuffle.ts — choice ordering for the `options.shuffle` / `options.sampleSize`
 * behavior (spec §5.2, §6). Pure and immutable: returns NEW arrays, never mutates
 * input. RNG is injectable so tests are deterministic and a future reset can
 * reproduce or re-vary order.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §5.2.
 */

/** Small deterministic PRNG (mulberry32). Returns a function yielding [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle into a new array. `rng` defaults to Math.random. */
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Shuffle then take the first n (clamped to length). New array. */
export function sampleN<T>(items: readonly T[], n: number, rng: () => number = Math.random): T[] {
  return shuffle(items, rng).slice(0, Math.max(0, Math.min(n, items.length)));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/exercises/lib/shuffle.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
bun run format && bun run lint && bun test && bun run build
git add src/exercises/lib/shuffle.ts src/exercises/lib/shuffle.test.ts
git commit -m "feat: add immutable shuffle + sampleN utilities (phase A)"
```

---

## Task 5: Reveal-gate predicate

**Files:**

- Create: `src/exercises/lib/reveal.ts`
- Test: `src/exercises/lib/reveal.test.ts`

The universal show-answers rule (spec §5.3): reveal after a Check, only when ≥1
answer is wrong; never before an attempt; never when all correct; and never when
`allowShowAnswers` is false. Family-agnostic — both scoring families map their state
onto the same `RevealInput` shape.

- [ ] **Step 1: Write the failing test**

```ts
// src/exercises/lib/reveal.test.ts
import { test, expect } from 'bun:test';
import { canRevealAnswers } from './reveal';

test('reveal: hidden before any attempt', () => {
  expect(canRevealAnswers({ hasAttempted: false, total: 4, nCorrect: 0 })).toBe(false);
});

test('reveal: hidden when all answers are correct', () => {
  expect(canRevealAnswers({ hasAttempted: true, total: 4, nCorrect: 4 })).toBe(false);
});

test('reveal: shown after an attempt with at least one wrong', () => {
  expect(canRevealAnswers({ hasAttempted: true, total: 4, nCorrect: 2 })).toBe(true);
});

test('reveal: never shown when allowShowAnswers is false', () => {
  expect(
    canRevealAnswers({ hasAttempted: true, total: 4, nCorrect: 0, allowShowAnswers: false }),
  ).toBe(false);
});

test('reveal: allowShowAnswers undefined behaves as allowed', () => {
  expect(canRevealAnswers({ hasAttempted: true, total: 2, nCorrect: 1 })).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/exercises/lib/reveal.test.ts`
Expected: FAIL — `Cannot find module './reveal'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/exercises/lib/reveal.ts
/**
 * reveal.ts — the universal Show-answers gate (spec §5.3).
 *
 * Rule: reveal becomes available after a Check, and ONLY when at least one answer
 * is wrong. Hidden before any attempt; hidden when everything is correct; and
 * removed entirely when the author sets `allowShowAnswers: false`.
 *
 * Family-agnostic. Each scoring family maps its own state onto RevealInput:
 *   - blank-grading: hasAttempted = hasChecked; total/nCorrect from the check.
 *   - sequence/placement: hasAttempted = interacted; nCorrect < total iff not
 *     `complete` (e.g. failCount > 0).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §5.3.
 */
export interface RevealInput {
  /** Author switch from options; undefined = allowed (default true). */
  allowShowAnswers?: boolean;
  /** Has the learner made a gradeable attempt yet (pressed Check / completed a pass)? */
  hasAttempted: boolean;
  /** Total gradeable items. */
  total: number;
  /** How many are currently correct. */
  nCorrect: number;
}

/** True when the Show-answers control should be available. */
export function canRevealAnswers(input: RevealInput): boolean {
  if (input.allowShowAnswers === false) return false;
  if (!input.hasAttempted) return false;
  return input.nCorrect < input.total; // at least one wrong
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/exercises/lib/reveal.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
bun run format && bun run lint && bun test && bun run build
git add src/exercises/lib/reveal.ts src/exercises/lib/reveal.test.ts
git commit -m "feat: add show-answers reveal-gate predicate (phase A)"
```

---

## Task 6: Documentation + checklist

**Files:**

- Modify: `docs/TOOLING.md`
- Modify: `docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md`

- [ ] **Step 1: Append a TOOLING.md section**

Add after the Step-13a "LO schema" section (before the `_Append a new section…_`
footer):

```markdown
### Exercise foundation — shared utils + options _(Phase A, spec 2026-06-19)_

- **What:** the React-free foundation under the 12 exercise engines:
  `src/config/exercise-types.ts` (the 12 canonical kebab `type` keys), the
  `options` block + `type` enum added to `lo-schema.ts`, and three pure utilities
  in `src/exercises/lib/` — `scoring.ts` (blank-grading helpers), `shuffle.ts`
  (immutable seeded shuffle + sampleN), `reveal.ts` (`canRevealAnswers` gate).
- **Why first:** the example LO referenced engines that did not exist; we build the
  engines first, and these pure pieces are what the first engine (`select`)
  consumes immediately — so nothing here is speculative.
- **Behavior locked here (spec §5):** Reset is implicit (always on); `shuffle`
  default off and re-applied on reset; Show-answers reveals only after a Check with
  ≥1 wrong (`allowShowAnswers:false` suppresses it).
- **Proven via `bun test`** — each util and the schema changes have a colocated
  `.test.ts`.
```

- [ ] **Step 2: Update the build checklist**

In `docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md`, replace the line 130 area for
step 14 to record the resequence. Change:

```
[ ] 14 lazyRegistry + first exercise cluster
```

to:

```
[ ] 14 Exercise engines (RESEQUENCED — see docs/specs/2026-06-19-exercise-engines-design.md)
    [x] Phase A foundation — exercise-types, options schema+enum, scoring/shuffle/reveal utils (src/exercises/lib/, bun test)
    [ ] Phase B — port 12 engines one-by-one (tsx + content schema + options + labels + registry + showcase fixture)
    [ ] Phase C — example LO (13b/13c) + static pre-render (15) from proven engines
```

- [ ] **Step 3: Verify and commit**

```bash
bun run format && bun run lint && bun test && bun run build
git add docs/TOOLING.md docs/process/LC_BASE_TEMPLATE_BUILD_HANDOVER.md
git commit -m "docs: record exercise foundation (phase A) in tooling + checklist"
```

---

## Done-when (Phase A acceptance)

- `bun test` green across all new suites (exercise-types, lo-schema, scoring, shuffle, reveal).
- `bun run build` succeeds.
- `ExerciseConfigSchema` rejects an unknown `type` and fills `options` defaults.
- No React, routing, or engine code added — foundation only.

## Deferred to Phase B (with their first consumer)

- `lazyRegistry` (engines register as ported) + a `getExercise(type)` lookup.
- The React exercise shell/hook composing reset + shuffle seed + `canRevealAnswers`.
- `answerNormalize` (read french-lo-1's exact dictation accent/punctuation policy at
  the `dictation` port), parsing (`parseSentence`/`parseInputBlank`/`parseChoiceBlank`),
  diff (`highlightTextDiff`).
- The debug-flag-gated showcase page.
