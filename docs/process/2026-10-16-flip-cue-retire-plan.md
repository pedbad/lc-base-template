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

- [x] **1. Exits.** `flip-cue-exits.test.ts` first (weights sum to 100, boundaries of
      each band, plan delays and order), see it fail, then `flip-cue-exits.ts`.
- [x] **2. Store.** `flip-cue-store.test.ts` first (key, absent / set / junk value, no
      storage, a throwing storage, subscribers told on retire), then `flip-cue-store.ts`.
- [x] **3. Phase and context.** The suite has no DOM, so the hook's logic moved into
      pure `flip-cue-phase.ts`: its test first (starts `shown`; the third turn returns
      true and leaves; `finishLeaving` → `gone`; a stored flag → `gone`, but not while
      leaving), then the module, `FlipCueContext.ts` (default tested) and the glue
      `useFlipCue.ts`.
- [x] **4. Cue view and CSS.** Extend `FlipCue.test.tsx` (`data-exit`, delay, sparkles
      for pop only, `onExitEnd` on its own animation only) and add
      `flip-cue-css.test.ts` (a keyframe per exit, reduced-motion fade, all in a layer),
      then `FlipCue.tsx` and `flip-cue.css`.
- [x] **5. Instructions.** Extend `ExerciseInstructions.test.tsx` (glyph shown, leaving,
      gone), then the prop; `ExerciseHost` provides the context and passes the phase.
- [x] **6. Engines.** Flashcards and memory-match render no corner once `gone`, and a
      host prerenders the pointer whatever was saved (`flip-cue-engines.test.tsx`), then
      the wiring. The clicks themselves were played by hand: the suite has no DOM.
- [x] **7. Check.** Full gate green; by hand in Chromium on the dev server's showcase:
      both memory decks, the flashcards deck, a reload after retiring. Not checked in a
      browser: dark mode (the corner keeps one token pair for both themes) and reduced
      motion (its CSS is tested in `flip-cue-css.test.ts`).
- [x] **8. Docs.** TODO §E21 done with a log row; the spec's status. Commit.
