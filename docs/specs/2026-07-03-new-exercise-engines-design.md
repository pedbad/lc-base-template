# Design — New exercise engines (catalog + first three)

**Status:** brainstorm approved 2026-07-03. Design record; implementation deferred
to a fresh session (flashcards first).
**Author:** session 2026-07-03
**Scope:** define a catalog of new language-learning exercise types beyond the 12
built in Phase B, converge on the first three to build, and specify each enough to
plan. Detailed flashcard design included (built next).

Related: `docs/specs/2026-06-19-exercise-engines-design.md` (the 12 existing
engines, skill map, scoring families), `docs/process/FUTURE_EXERCISE_IDEAS.md`
(parked ideas), `docs/process/2026-07-03-exercise-engines-buildlist.md` (progress
checklist).

---

## 1. Context — what already exists

Twelve engines shipped (Phase B), by skill trained:

| Skill                         | Engines                                      |
| ----------------------------- | -------------------------------------------- |
| Reading / grammar recognition | select, inline-choice, radio-quiz, word-spot |
| Written production            | inline-gap, typed-transform, dictation       |
| Syntax / word order           | word-order, phrase-reorder                   |
| Matching / vocab recall       | line-match, memory-match, drag-fill-gaps     |
| Listening                     | dictation (only one)                         |

Two **scoring families** (spec 2026-06-19 §7): _blank-grading_ and _sequence_,
plus two _own-model_ engines (memory-match, word-spot). Content blocks already
model grammar, vocabulary, **pronunciation**, dialogue, monologue — but there is a
pronunciation _block_ with no pronunciation _exercise_, and only one listening
engine.

Cross-cutting conventions every new engine inherits:

- **WCAG 3.1.2 lang tagging:** wrap only target-language content in
  `lang={TARGET_LANG}` (`src/lib/lang.ts`); UI chrome stays `en`. Retrofit
  completed across all 12 engines (commits `7fa1e94`→`9df7f6f`).
- **Audio subsystem is reusable:** `src/audio/AudioManager.ts`, `useAudioClip.ts`,
  `src/components/audio/AudioClip.tsx`, `CircularAudioProgressAnimatedSpeaker.tsx`
  (speaker-icon play control with progress ring). New engines reuse these — no new
  audio infra.
- **Static-SSG model:** config-driven JSON content, per-type Zod schema, no
  backend. `localStorage` is permitted (client-only, no server).

## 2. Catalog

### Net-new engines (fill a skill/interaction gap)

| Candidate                   | Learner does                                  | Skill             | Scoring / model                             | Static-fit           |
| --------------------------- | --------------------------------------------- | ----------------- | ------------------------------------------- | -------------------- |
| **Flashcards**              | Flip card term ↔ translation/image; self-rate | Vocab acquisition | Own-model; localStorage → spaced repetition | Yes (+localStorage)  |
| **Conjugation table**       | Fill a verb-paradigm grid                     | Grammar           | Blank-grading (typed)                       | Yes                  |
| **Reading comprehension**   | Read passage, answer question set             | Reading           | Blank-grading (aggregate)                   | Yes                  |
| **Listening comprehension** | Play clip, answer questions                   | Listening         | Blank-grading                               | Yes (reuses audio)   |
| **Categorization / sort**   | Drag items into labeled buckets               | Grammar/vocab     | Sequence-family own-model                   | Yes                  |
| **Image–word match**        | Match pictures ↔ words                        | Vocab             | Blank-grading (images)                      | Yes (media pipeline) |

### Variants (config or thin wrapper on existing engines)

- **True/False/Not-Given** → radio-quiz config
- **Odd-one-out** → radio-quiz config
- **Paragraph cloze w/ word bank** → drag-fill-gaps config
- **Timed / speed round** → cross-cutting _modifier_ (timer over any engine), not an engine

## 3. Convergence — build order

1. **Flashcards** — the one _acquisition_ (not testing) tool missing; user-requested;
   own-model like memory-match. SRS is the pedagogical payoff.
2. **Conjugation table** — highest grammar leverage; reuses blank-grading; one
   engine serves every verb in every LO.
3. **Reading comprehension** — biggest missing _skill_ (reading-at-length);
   composes existing per-question scoring.

Listening-comprehension and categorization are strong 4th/5th — held a round, see
`FUTURE_EXERCISE_IDEAS.md` Tier A.

## 4. Flashcards — detailed design (built next)

Own-model engine (self-assessed, like memory-match). **No Check/Show-answers
footer** — instruction copy references flipping + self-rating only.

### Content schema (`flashcards-schema.ts`)

```
{
  cards: [
    {
      target,          // Spanish term (the language being learned)
      native,          // English translation
      image?,          // optional image asset (media pipeline)
      audio?,          // optional recorded clip for the target term
    }
  ],
  instructions?,
}
options: { shuffle?, srs? }
```

- `target`/`native` are named by role, NOT by side, so the direction toggle can put
  either on the front. Audio + `lang={TARGET_LANG}` always attach to `target`.

### Direction toggle

- Learner-controlled, both ways. **Default: Spanish→English** (target→native,
  recognition-first — easier entry). Learner can flip to English→Spanish
  (production-first).
- Author MAY lock a deck to one direction (build-time decision — see §10).

### Audio

- **Recorded native clips per card**, author-supplied (`.mp3`/`.m4a` — match the
  existing dictation pipeline; NOT `.mp4`, a video container). Placeholder clips for
  the demo/showcase.
- Audio icon (reuse `CircularAudioProgressAnimatedSpeaker`/`AudioClip`) attaches to
  the **Spanish (`target`) field** wherever it renders — front when
  Spanish→English, back when reversed.
- TTS is explicitly NOT used (unnatural prosody misleads learners); parked as a
  Tier-B fallback only. See `FUTURE_EXERCISE_IDEAS.md`.

### Accessibility

- `target` content wrapped in `lang={TARGET_LANG}`; chrome (buttons, progress,
  "card 2 of 10") stays `en`.
- Flip control keyboard-operable; self-rate buttons real `<button>`s; audio control
  labeled. Deck usable by keyboard alone.

### Build in 2 steps

- **Step 1 (shippable checkpoint):** in-memory deck — shuffle, flip, self-rate
  (Again / Good), advance, progress indicator, "restart deck", direction toggle,
  audio. No persistence.
- **Step 2 (SRS):** `localStorage` Leitner scheduler (3–5 boxes), keyed per
  LO+exercise. Wrong cards resurface soon; known cards fade. "Reset progress"
  control. Graceful fallback when storage is absent/corrupt/cleared. SSG
  pre-renders first paint (card 1 front); shipped JS reads `localStorage` on mount.

## 5. Conjugation table — design (build after flashcards)

Blank-grading family; standard Check / Reset / Show-answers footer.

```
{ verb, tense?, prompt?, rows: [{ person, answer }], instructions? }
```

- Grid: left column = person/pronoun (given), right = typed input per form.
- **v1 = single tense** (one answer column); multi-tense grid parked.
- Reuses inline-gap typed-answer normalization for accents (é, ñ). Dedicated
  accent-insertion helper is a future nicety.
- `lang={TARGET_LANG}` on verb/forms.

## 6. Reading comprehension — design (build third)

Blank-grading, composite (embeds question sub-widgets).

```
{ passage, questions: [{ type: 'radio' | 'true-false', prompt, options?, answer }], instructions? }
```

- Renders lang-tagged passage + stacked questions, each reusing radio-quiz's
  question unit. Scoring aggregates across questions; standard footer.
- **v1 = MCQ + true/false only.** Short-answer (typed) questions parked (fair
  auto-grading is harder).

## 7. Per-engine architecture touchpoints

Each engine adds/edits, in order:

1. `src/config/exercise-types.ts` — add key to `EXERCISE_TYPE_KEYS` (this makes the
   `EXERCISE_INSTRUCTIONS` Record non-exhaustive → tsc error until copy added; good
   guard).
2. `src/exercises/<type>/<type>-schema.ts` — Zod content schema, spread
   `instructionsField`.
3. `src/exercises/<type>/<Type>Exercise.tsx` — engine component.
4. `src/exercises/lazyRegistry.ts` — register behind `lazy()`.
5. `src/exercises/lib/instructions.ts` — add `EXERCISE_INSTRUCTIONS` entry.
6. `src/showcase/fixtures.ts` — showcase card(s).
7. ui-strings/labels for any new chrome text.
8. Tests (`bun test`) + tsc clean + showcase a11y verify.

## 8. Pointer

Non-chosen and infra-heavy ideas live in
`docs/process/FUTURE_EXERCISE_IDEAS.md`, tiered by infra cost.

## 9. Open decisions deferred to build time

- Flashcards: self-rate scale — 2-button (Again/Good) vs 4-button (Again/Hard/
  Good/Easy). Lean 2-button for v1.
- Flashcards: author direction-lock — support in schema v1, or add later?
- Confirm audio file extension against the existing dictation clips.
- SRS algorithm detail: plain Leitner boxes vs SM-2 lite (decide at Step 2).
