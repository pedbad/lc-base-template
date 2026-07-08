# Build checklist — new exercise engines

**Status:** not started. Tracks the three engines from
`docs/specs/2026-07-03-new-exercise-engines-design.md`.
**Legend:** `[ ]` todo · `[~]` in progress · `[x]` done

Per-engine touchpoints are defined in the design doc §7. Each box below is a
commit-sized unit.

---

## 1. Flashcards `[~]` — build FIRST, in two steps

### Step 1 — in-memory deck (shippable checkpoint) `[x]`

- [x] `exercise-types.ts` — add `flashcards` key
- [x] `flashcards/flashcards-schema.ts` — Zod (`cards[{target,native,image?,audio?}]`, `options{shuffle?,direction?,lockDirection?,srs?}`, `instructionsField`)
- [x] `flashcards/FlashcardsExercise.tsx` — flip, self-rate (Again/Good), advance, progress, restart (thin view over pure `flashcards-deck.ts`)
- [x] Direction toggle — default Spanish→English, learner-flippable; author `lockDirection` hides it
- [x] Audio icon on `target` field (reuse `AudioClip` / `CircularAudioProgressAnimatedSpeaker`)
- [x] `lang={TARGET_LANG}` on target content only
- [x] `lazyRegistry.ts` — register
- [x] `instructions.ts` — `EXERCISE_INSTRUCTIONS.flashcards` (flip + self-rate copy, no Check/Show-answers)
- [x] `flashcards.fixture.ts` — card(s) with placeholder audio clips (`.m4a`; colocated per refactor `8df1f4e`)
- [x] Tests (`bun test`) + tsc clean — 15 flashcards tests (schema + pure deck reducer)
- [x] Showcase a11y verify — keyboard flip/rate, audio label, lang tagging (verified 2026-07-08)

### Step 2 — SRS layer `[ ]`

- [ ] `localStorage` Leitner scheduler (3–5 boxes), keyed per LO+exercise
- [ ] Due-ordering on load; wrong resurfaces, known fades
- [ ] "Reset progress" control
- [ ] Graceful fallback: storage absent/corrupt/cleared → fresh deck
- [ ] Tests for scheduler logic (pure functions) + storage edge cases

---

## 2. Conjugation table `[ ]` — build SECOND

- [ ] `exercise-types.ts` — add `conjugation` key
- [ ] `conjugation/conjugation-schema.ts` — `{verb,tense?,prompt?,rows[{person,answer}]}` + `instructionsField`
- [ ] `conjugation/ConjugationExercise.tsx` — grid, typed input per form, blank-grading + standard footer
- [ ] Reuse inline-gap typed-answer normalization (accents)
- [ ] `lang={TARGET_LANG}` on verb/forms
- [ ] `lazyRegistry.ts` · `instructions.ts` · `showcase/fixtures.ts`
- [ ] Tests + tsc + a11y verify

---

## 3. Reading comprehension `[ ]` — build THIRD

- [ ] `exercise-types.ts` — add `reading` key
- [ ] `reading/reading-schema.ts` — `{passage,questions[{type,prompt,options?,answer}]}` + `instructionsField`
- [ ] `reading/ReadingExercise.tsx` — passage + stacked questions, reuse radio-quiz question unit, aggregate blank-grading
- [ ] v1 = MCQ + true/false only (short-answer parked)
- [ ] `lang={TARGET_LANG}` on passage
- [ ] `lazyRegistry.ts` · `instructions.ts` · `showcase/fixtures.ts`
- [ ] Tests + tsc + a11y verify

---

## Notes

- Adding a key to `EXERCISE_TYPE_KEYS` before adding its `EXERCISE_INSTRUCTIONS`
  copy is a tsc error by design — add the copy in the same commit.
- Confirm audio extension (`.mp3`/`.m4a`) against existing dictation clips before
  wiring flashcard audio.
