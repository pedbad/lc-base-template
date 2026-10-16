# Flip cue retires after three turns (E21) Implementation Plan

**Goal:** Retire the "Tap to flip" corner, and the instruction box's pointer glyph, after
three cards are turned in an exercise, with a random fun exit, as designed in
[`2026-10-16-flip-cue-retire-design.md`](../specs/2026-10-16-flip-cue-retire-design.md).

**Architecture:** A pure exit picker, a guarded localStorage flag, and a hook that holds
the phase. `ExerciseHost` owns the hook and shares it through a context, so the
instruction box and the engine below it see the same phase. The engines report turns
and plan the exits in their event handlers; CSS plays them.

**Rules** (AGENTS.md): test first, beside the code; `bun run test`, never `bun test`;
tokens only; every CSS rule in `@layer`; prerender equals the first client render;
reduced motion in CSS; one concern per commit.

## Tasks

- [ ] **1. Exits.** `flip-cue-exits.test.ts` first (weights sum to 100, boundaries of
      each band, plan delays and order), see it fail, then `flip-cue-exits.ts`.
- [ ] **2. Store.** `flip-cue-store.test.ts` first (key, absent / set / junk value, no
      storage, a throwing storage, subscribers told on retire), then `flip-cue-store.ts`.
- [ ] **3. Hook and context.** `useFlipCue.test.tsx` first (starts `shown`; the third
      turn returns true and leaves; saved; `finishLeaving` → `gone`; a stored flag →
      `gone`; no key → memory only), then `useFlipCue.ts` and `FlipCueContext.ts`.
- [ ] **4. Cue view and CSS.** Extend `FlipCue.test.tsx` (`data-exit`, delay, sparkles
      for pop only, `onExitEnd` on its own animation only) and add
      `flip-cue-css.test.ts` (a keyframe per exit, reduced-motion fade, all in a layer),
      then `FlipCue.tsx` and `flip-cue.css`.
- [ ] **5. Instructions.** Extend `ExerciseInstructions.test.tsx` (glyph shown, leaving,
      gone), then the prop; `ExerciseHost` provides the context and passes the phase.
- [ ] **6. Engines.** Flashcards and memory-match tests through a host (three turns
      retire, exits planned, nothing replayed after Reset), then the wiring.
- [ ] **7. Check.** Full gate; by hand in the dev server: both engines, light and dark,
      reduced motion, a reload after retiring.
- [ ] **8. Docs.** TODO §E21 done with a log row; the spec's status. Commit.
