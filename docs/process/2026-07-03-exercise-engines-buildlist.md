# Build checklist — new exercise engines

**Status:** ✅ ALL DONE (2026-07-11). All three engines built, tested, merged, pushed.
Tracks the three engines from `docs/specs/2026-07-03-new-exercise-engines-design.md`.
**Legend:** `[ ]` todo · `[~]` in progress · `[x]` done

> **Superseded for live status — see git log + `2026-07-08-handover.md`.** This file is
> now a historical build record. One open fast-follow remains outside this list:
> conjugation §4.3 **v2 choice mode** (schema ready, view path unbuilt — parked).

Per-engine touchpoints are defined in the design doc §7. Each box below is a
commit-sized unit.

---

## 1. Flashcards `[x]` — build FIRST, in two steps

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

### Step 2 — SRS layer `[x]` (done 2026-07-11)

- [x] `localStorage` Leitner scheduler (3–5 boxes), keyed per LO+exercise
- [x] Due-ordering on load; wrong resurfaces, known fades
- [x] "Reset progress" control
- [x] Graceful fallback: storage absent/corrupt/cleared → fresh deck
- [x] Tests for scheduler logic (pure functions) + storage edge cases

---

## 2. Conjugation table `[x]` — build SECOND (typed v1 done 2026-07-11)

- [x] `exercise-types.ts` — add `conjugation` key
- [x] `conjugation/conjugation-schema.ts` — `{verb,tense?,prompt?,rows[{person,answer,options?}]}` + `answerMode` + `instructionsField`
- [x] `conjugation/ConjugationExercise.tsx` — grid, typed input per form, blank-grading + standard footer
- [x] Reuse inline-gap typed-answer normalization (accents)
- [x] `lang={TARGET_LANG}` on verb/forms
- [x] `lazyRegistry.ts` · `instructions.ts` · `showcase/fixtures.ts`
- [x] Tests + tsc + a11y verify
- [ ] **v2 fast-follow (open):** choice mode (`answerMode:'choice'`, tap `row.options`) — schema ready, view path unbuilt

---

## 3. Reading comprehension `[x]` — build THIRD (done 2026-07-11)

- [x] `exercise-types.ts` — add `reading` key
- [x] `reading/reading-schema.ts` — `{passage,questions[{type,prompt,options?,answer}]}` + `instructionsField`
- [x] `reading/ReadingExercise.tsx` — passage + stacked questions, reuse radio-quiz question unit, aggregate blank-grading
- [x] v1 = MCQ + true/false only (short-answer parked)
- [x] `lang={TARGET_LANG}` on passage
- [x] `lazyRegistry.ts` · `instructions.ts` · `showcase/fixtures.ts`
- [x] Tests + tsc + a11y verify

---

## Notes

- Adding a key to `EXERCISE_TYPE_KEYS` before adding its `EXERCISE_INSTRUCTIONS`
  copy is a tsc error by design — add the copy in the same commit.
- Confirm audio extension (`.mp3`/`.m4a`) against existing dictation clips before
  wiring flashcard audio.
