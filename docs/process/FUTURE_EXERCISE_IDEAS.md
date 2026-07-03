# Future exercise ideas — parking lot

Candidate exercise types **not** in the current build queue
(`docs/specs/2026-07-03-new-exercise-engines-design.md` covers the three being
built: flashcards, conjugation table, reading comprehension). Tiered by the
infrastructure each needs. Promote an item into the design doc + buildlist when
its tier is unblocked and its value justifies the work.

---

## Tier A — static-fit, ready to build (no new infra)

These need only the existing static-SSG + config + scoring families. They were
ranked below the top three, not blocked.

- **Listening comprehension** — play an audio clip, answer MCQ/gap questions about
  it (beyond word-for-word dictation). Skill: listening. Reuses the audio subsystem
  and blank-grading. _Strongest Tier-A candidate — likely the 4th engine._
- **Categorization / sort into buckets** — drag items into labeled groups
  (masc/fem, tense, semantic set). Skill: grammar/vocab. Sequence-family own-model.
- **Image–word match** — match pictures ↔ words/phrases. Skill: vocab. Uses the
  media pipeline; blank-grading like line-match.
- **True/False/Not-Given** — statement judged against a text. A radio-quiz config
  with exam-standard framing (Cambridge/IELTS).
- **Odd-one-out** — pick the item that doesn't belong. A radio-quiz config.
- **Paragraph cloze with word bank** — a drag-fill-gaps config at passage scale.

## Tier B — browser-native APIs (no backend, but new client capability)

- **Pronunciation playback via TTS (Web Speech API)** — machine text-to-speech as a
  _fallback_ for cards/items lacking recorded audio. Deliberately NOT the primary:
  TTS prosody/stress is unnatural and misleads learners who imitate it. Recorded
  native audio always preferred. Coverage-gap fallback only.
- **Speech-recognition scoring (Web Speech API ASR)** — learner speaks, browser
  transcribes, compare to target. Enables a real speaking/pronunciation exercise
  (fills the pronunciation-block gap). Accuracy and browser support are uneven.
- **Audio recording + self-compare (MediaRecorder)** — learner records themselves,
  plays back against the native clip. No auto-scoring; self-assessed.

## Tier C — backend / AI (server or model calls)

- **Free-writing with AI feedback** — open written response graded/critiqued by an
  LLM. Needs a backend and model access.
- **Conversation / roleplay bot** — dialogue practice against an AI partner. Fills
  the dialogue/monologue-block gap interactively.
- **Adaptive difficulty / AI-generated items** — generate or reorder items to the
  learner's level. Needs a backend + learner-state store.

## Cross-cutting modifiers (not engines)

- **Timed / speed round** — a timer wrapper applied over any existing engine, adding
  time pressure and a score. Implement as a shared modifier, not a new engine type.
