# Exercise Engines — Design Spec

**Date:** 2026-06-19
**Status:** Approved (brainstormed 2026-06-19), ready for an implementation plan
**Scope:** How the 12 interactive exercise engines are ported from `french-lo-1`
into `lc-base-template`, the behavior they all share, and the order we build them.
**Extends:** the main design spec `docs/specs/2026-06-15-lc-base-template-design.md`
(§6 folder-per-LO, §9 ui-strings, §10 exercise engines, §15 render-mirror) and the
Step-13a schemas in `src/config/lo-schema.ts`.

---

## 1. Why this doc exists

The build checklist had a hidden ordering bug: **Step 13b (the example LO) came
before Step 14 (the exercise engines)**. But the example LO is made of exercise
accordions — you can't author a real, Zod-valid, _renderable_ example LO when the
engines it references don't exist yet and their content shapes are undefined.

So we flipped the order. **Build all 12 engines first, verify each one-by-one in the
showcase, then author the example LO from proven parts.** This doc captures the
decisions that make that port repeatable and consistent — especially the behaviors
every engine shares (reset, shuffle, show-answers), which `french-lo-1` implemented
inconsistently and the template will unify.

---

## 2. The 12 engines

`french-lo-1`'s registry has **12 interactive exercise types** (not 13 — see §3).
We rename their `PascalCase` keys to the template's **kebab-case** convention (the
same style already seeded in `lo-schema.ts`).

| #   | Template key      | From (french-lo-1)     | What the learner does                                                  | Skill trained                     | Scoring family |
| --- | ----------------- | ---------------------- | ---------------------------------------------------------------------- | --------------------------------- | -------------- |
| 1   | `select`          | SelectExercise         | Picks from dropdown blanks `[a\|b\|c]` in a sentence                   | Recognition in context            | blank-grading  |
| 2   | `inline-choice`   | InlineChoiceGroup      | Picks from inline radio buttons inside text                            | Rapid recognition                 | blank-grading  |
| 3   | `radio-quiz`      | RadioQuiz              | Answers multiple-choice questions (optional explanation)               | Comprehension check               | blank-grading  |
| 4   | `inline-gap`      | InlineTypedGapExercise | Types into inline blanks `[answer]` in flowing prose                   | Contextual recall (cloze)         | blank-grading  |
| 5   | `typed-transform` | TypedTransformExercise | Hears/reads a prompt, types a _transformed_ form (plural, conjugation) | Active production of morphology   | blank-grading  |
| 6   | `dictation`       | DictationExercise      | Hears audio, transcribes it (accent/punctuation-tolerant)              | Listening + spelling              | blank-grading  |
| 7   | `word-order`      | WordOrderExercise      | Drags word cards into correct sentence order                           | Word-order rules                  | sequence       |
| 8   | `phrase-reorder`  | PhraseReorderExercise  | Reorders a phrase to the expected order                                | Phrase-level syntax               | sequence       |
| 9   | `drag-fill-gaps`  | DraggableFillGaps      | Drags word tiles into table/phrase slots                               | Vocab + agreement (kinesthetic)   | sequence       |
| 10  | `line-match`      | LineMatch              | Draws connector lines image ↔ word                                     | Vocab recognition + visual memory | blank-grading  |
| 11  | `memory-match`    | MemoryMatchGame        | Flips cards to pair image ↔ text                                       | Vocab retention (game)            | (own model)    |
| 12  | `word-spot`       | WordSpotExercise       | Clicks bracketed part-words to mark a target sound                     | Phonetic recognition              | (own model)    |

> **`ClozeTyping` is dropped.** The spec once named it in the "TextEntry family";
> it never existed as its own component. The cloze-typing job is `inline-gap`.

---

## 3. The showcase: 13 cards, 12 engines

The exercise showcase (dev artifact #2 — the catalog where each engine is verified
in isolation) has **13 fixtures**, because `select` is shown **twice**:

- **`select` (rows)** — each blank on its own row.
- **`select` (inline)** — blanks inline in a passage (`layoutMode: "inline-passage"`).

That's **one engine, one schema, two `layoutMode` values** — proving both display
modes. This is why the old spec said "13": it counted showcase cards, not engines.
Components stay shared (main spec §6); only the fixture content differs.

---

## 4. Anatomy of one exercise config file

Every exercise is one small JSON file inside its LO folder
(`lo-config/lo-01-…/exercises/01-select/exercise.json`). It has up to four parts:

```jsonc
{
  // WHICH engine renders this — resolved via lazyRegistry. Required.
  "type": "select",

  // WHAT is unique to this exercise. Shape differs per type. Required.
  "content": {
    "items": [{ "text": "Je [suis|est|es] étudiant.", "audio": "01-select/q1.mp3" }],
    "layoutMode": "rows",
  },

  // HOW it behaves — the SAME switches for all 12 types, set per instance. Optional.
  "options": { "shuffle": true },

  // Per-exercise chrome wording override (Layer 2, ui-strings §9). Optional.
  "labels": { "check": "Vérifier" },
}
```

The mental model:

| Field     | Meaning                                               | Same across types?                         |
| --------- | ----------------------------------------------------- | ------------------------------------------ |
| `type`    | which engine                                          | — (the selector)                           |
| `content` | the unique payload (sentences, words, images, audio)  | **No** — per type                          |
| `options` | behavior switches (shuffle, sampleSize, allow-reveal) | **Yes** — one shared shape                 |
| `labels`  | chrome word overrides                                 | **Yes** — reuses `UiStringsOverrideSchema` |

This split is the key design decision: **unique stuff lives in `content`; shared
behavior lives in `options`.** Shuffle is defined _once_ (not copied into 12 content
schemas), but its _value_ is set per file — so two `select` boxes can behave
differently (see §5.2).

---

## 5. The shared behavior contract

Three behaviors every engine has. `french-lo-1` had all three but named them
differently per exercise; the template makes them one consistent contract (a shared
hook/shell + the existing scoring helpers).

### 5.1 Reset — always present

Every exercise has a **Reset** control. It clears learner input and scoring back to
a fresh baseline (via a factory, so each reset gets its own clean state — no shared
mutable map). Not configurable; it's always there.

### 5.2 Shuffle — opt-in, default off

A single `options.shuffle` flag (default `false`). Authors opt in. It replaces
`french-lo-1`'s three different names (`shuffleItems`, `shuffleOnLoad`,
`sampleSize`).

Two meanings, kept distinct:

- **Choice-order engines** (`select`, `inline-choice`, `radio-quiz`, `line-match`,
  `memory-match`, `drag-fill-gaps` tiles): `shuffle: true` randomizes the presented
  choices. `shuffle: false` keeps the author's order — for when the choices have a
  narrative or logical order that shouldn't be scrambled.
- **Order-is-the-answer engines** (`word-order`, `phrase-reorder`): scrambling _is_
  the exercise, so they always scramble. The `shuffle` flag is **not applicable**.

**Example — same engine, two behaviors:**

```jsonc
// A counting drill: order matters (un, deux, trois…) → do NOT shuffle.
{ "type": "select", "content": { /* … */ }, "options": { "shuffle": false } }

// A vocabulary check: order is irrelevant → shuffle every attempt.
{ "type": "select", "content": { /* … */ }, "options": { "shuffle": true } }
```

**Reset + shuffle:** the one flag governs both. `shuffle: true` → Reset produces a
fresh random order (a genuinely new attempt). `shuffle: false` → there's nothing to
shuffle, so the authored order stays. No separate "reshuffle on reset" flag.

### 5.3 Show-answers — reveal after a wrong check

One universal rule, **not configurable**:

> **Show-answers appears after a Check, and only when at least one answer is wrong.**
> It's hidden before the first Check, and hidden if everything is correct.

Pedagogy: a student who got it all right has nothing to reveal; a student who hasn't
tried yet shouldn't peek. Both scoring families realize the same rule with their own
fields:

- **blank-grading:** `hasChecked && nCorrect < total`
- **sequence/placement:** attempted but not `complete` (`failCount > 0`)

**Escape hatch:** `options.allowShowAnswers` (default `true`). Set `false` to remove
the reveal entirely — e.g. a `memory-match` game where "show answers" makes no sense.

---

## 6. The options schema

`options` is added to Step-13a's exercise envelope (`ExerciseConfigSchema` in
`src/config/lo-schema.ts`) as an **optional** block:

```ts
// Shared by all 12 engines; every field optional; values set per instance.
const ExerciseOptionsSchema = z.object({
  shuffle: z.boolean().default(false), // §5.2
  sampleSize: z.number().int().positive().optional(), // show a random N of M choices; omit = all
  allowShowAnswers: z.boolean().default(true), // §5.3 escape hatch
});
// ExerciseConfigSchema gains:  options: ExerciseOptionsSchema.optional()
```

That's the **whole** options surface. Three switches, all optional. Reset and the
show-after-wrong-check reveal are implicit (always on), so they are **not** fields.

**`sampleSize` example** — a 20-word vocab bank, quiz a random 5 each visit:

```jsonc
{
  "type": "select",
  "content": {
    /* 20 items */
  },
  "options": { "shuffle": true, "sampleSize": 5 },
}
```

---

## 7. The two scoring families

Engines split into two progress-tracking models. This matters because Reset and the
reveal rule read different fields in each.

| Family                   | Engines                                                                               | Tracks with                                | "Reset" clears                     | Reveal when                                |
| ------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------- | ------------------------------------------ |
| **Blank-grading**        | select, inline-choice, radio-quiz, inline-gap, typed-transform, dictation, line-match | `hasChecked`, `checkedResults`, `nCorrect` | back to `getInitialScoringState()` | `hasChecked && nCorrect < total`           |
| **Sequence / placement** | word-order, phrase-reorder, drag-fill-gaps                                            | `failCount`, `complete`                    | placement state + counters         | attempted, `failCount > 0`                 |
| **Own model**            | memory-match (card flips), word-spot (click-mark)                                     | per-engine                                 | per-engine                         | per-engine (apply the §5.3 rule in spirit) |

The shared scoring helpers (`getInitialScoringState`, `countCorrect`, `commitCheck`)
port once and serve the blank-grading family. Scoring fields stay inside each
engine's single merge reducer (atomic updates with input/diff state) — we do **not**
lift them into a separate store.

---

## 8. The per-exercise port contract (repeatable)

Each engine is ported the same way — this is the loop we repeat 12 times:

1. **`.jsx` → `.tsx`** — typed props/content; no `any`.
2. **Per-type `content` Zod schema** — defined _now_, when this engine is in front
   of us (tightens 13a's loose `content` for this one `type`). Not all 12 upfront.
3. **Wire `options`** — shuffle / sampleSize / allowShowAnswers from the shared block.
4. **Wire labels** — replace hardcoded English button text with
   `resolveLabel(key, config.labels)` (ui-strings, §9).
5. **Register** in the template `lazyRegistry` under the kebab key.
6. **Add a showcase fixture** — the surface where we _see and test it_ before moving
   on (`select` gets two fixtures).

**Ported once, not per engine** (shared foundation, built first):

- shared exercise shell/hook (reset + shuffle seed + reveal gate)
- scoring helpers (`exerciseScoring`)
- parsing (`parseSentence`, `parseInputBlank`, `parseChoiceBlank`)
- diff display (`highlightTextDiff`)
- audio (`SequenceAudioController`, `useExerciseAudio`)
- answer normalization (`normalizeAnswer`, `normalizeForDictation`)

**Verify per engine before the next:** `bun run format · lint · lint:css · bun test
· build`, plus the engine visible and working in the showcase.

---

## 9. TextEntry cluster decision

`typed-transform` and `dictation` share `TextEntryExerciseRuntime` in `french-lo-1`,
which carries a `TODO(component-split)`: the plan was to split it into a UI-only base
plus separate behavior controllers once their normalization rules diverge
(transform = agreement-tolerant; dictation = punctuation/accent policy).

**Decision:** port **as-is** first (one shared runtime, behavior split by flags) to
get both engines green, then split into base + `TypedTransformController` /
`DictationController` **only if** the normalization rules actually need to diverge in
the template. We do not inherit a "compatibility layer" we don't need, but we also
don't pre-split speculatively. Revisit when porting engine #6 (`dictation`).

---

## 10. PhraseTable is not an exercise

`french-lo-1`'s `PhraseTable` (bilingual phrase table with audio) is **display-only**
and not in the exercise registry. It is **out of scope** for the 12-engine port.
Later it can become a **content block** type (e.g. `phrase-table` under a block
schema), not a registry exercise.

---

## 11. Resequenced build order

Replaces the old `13b → 14 → … → 17 → … → 27` ordering. Three phases:

**Phase A — Exercise foundation (once):**

- Template `lazyRegistry` + the shared exercise shell/hook (reset, shuffle, reveal).
- Port the shared utils (§8 "ported once").
- Add `ExerciseOptionsSchema` to `lo-schema.ts` and a stub showcase page.

**Phase B — Port the 12 engines, one-by-one:**

- For each engine: the §8 contract (tsx + content schema + options + labels +
  registry + showcase fixture), verified in the showcase before the next.
- Suggested order (simple → complex, cluster-aware):
  `select` → `inline-choice` → `radio-quiz` → `inline-gap` →
  `typed-transform` → `dictation` (TextEntry cluster, §9) →
  `line-match` → `word-spot` → `memory-match` →
  `word-order` → `phrase-reorder` → `drag-fill-gaps` (sequence cluster last).

**Phase C — Example LO + rendering (the original Step 13b/13c/15):**

- Author the example LO folder (`lo.json` + parts) using **only proven engines**.
- Build the loader/stitcher (validates each part + the assembled LO).
- Static pre-render (auto-discover `lo-config/*/lo.json`).

The build-handover checklist will be updated to reflect these phases when Phase A
starts. Step 13a (schemas) is already done; `options` is the one addition pending.

---

## 12. Deferred (YAGNI for now)

- **`after-attempts` reveal gate** — needs a per-family attempt counter and a
  definition of "attempt" for drag exercises. Add only when an exercise needs it;
  the Zod enum won't accept it until then (can't author a gate that does nothing).
- **`reshuffleOnReset`** — separate from `shuffle`. Not needed; reset re-applies the
  `shuffle` flag.
- **`phrase-table` block type** — when content blocks are built (§10).
- **Exact per-type `content` schemas** — defined incrementally, per engine at port
  time (§8 step 2), not all 12 upfront.

---

## Decisions log (quick scan)

- 12 engines, **kebab keys**; `ClozeTyping` dropped (= `inline-gap`).
- Showcase = **13 fixtures** (`select` ×2: rows + inline).
- Config envelope = `type` + `content` (per-type) + `options` (shared) + `labels`.
- `options` = `{ shuffle?, sampleSize?, allowShowAnswers? }`, all optional, per-instance.
- **Reset** always on; re-shuffles when `shuffle: true`.
- **Shuffle** default **off**; N/A for order-is-answer engines (always scramble).
- **Show-answers** = after a Check **only if ≥1 wrong**; not configurable;
  `allowShowAnswers: false` suppresses entirely.
- Two scoring families (blank-grading / sequence) + two own-model engines.
- TextEntry cluster: port **as-is**, split only if normalization diverges.
- `PhraseTable` → out of scope; future content block, not an exercise.
- **Build all 12 + showcase before the example LO.**
