# Flip cards — the "Tap to flip" corner retires after three turns (E21)

**Date:** 2026-10-16 · **Status:** built 2026-10-16 (`1eccb86`); ten exits 2026-10-23 (E39)
**TODO:** §E21 · **Builds on:** `FlipCue` (2026-10-09, scaled for memory-match 2026-10-12)

## 1. Why

The Light Blue triangle in a flip card's bottom-right corner (`FlipCue`) teaches a new
learner that the card turns over. A learner suggested (via the maintainer, 2026-10-16)
that once they have turned a few cards it has done its job and only takes up the card.
The instruction box's pointer glyph before **Tap to flip** is the same lesson and goes
with it.

## 2. Decisions (maintainer, 2026-10-16)

- **Three cards turned retires the cue for that exercise.** Each exercise counts on its
  own. Flashcards count a turn from front to back; memory-match counts every card turned
  face up, so the cue goes during the second try.
- **Remembered per exercise.** Once retired, an exercise never shows the cue again in
  that browser. The flag is saved under the same `progressId` that keys flashcards'
  progress (E13a), so a course reorder starts it afresh, as it does progress. An
  exercise without a `progressId` (the showcase) retires for the visit only. The count
  itself is not saved: two turns, a reload, and the learner needs three more.
- **It leaves straight after the third turn, with a fun exit.** Each cue picks one of
  ten exits at random, all equally likely (maintainer, 2026-10-23, E39; until then four,
  weighted peel 35, pop 35, wave 15, tuck 15): **peel** (lifts, curls and drops off like
  a sticker), **pop** (swells and bursts into five sparkles), **wave** (the pointer
  waves, then the triangle slides out of the corner), **tuck** (a bounce, then it
  shrinks into the corner), **fold** (folds over its diagonal like a dog-ear), **flip**
  (turns over like the card), **wipe** (wiped back into the corner), **spin**
  (pinwheels away), **shatter** (trembles, then two shards fly apart as it vanishes)
  and **melt** (squashes into the bottom edge). In memory-match every card picks its
  own, 70 ms apart in deck order, so the exits ripple across the grid.
- **Flashcards play their exit on the next front.** The third turn shows the card's back,
  so the cue on the front cannot be seen leaving. It leaves as the next card's front
  appears, after the learner rates.
- **The instruction glyph fades** at the same moment and is gone afterwards. The words
  **Tap to flip** stay bold.
- **Reduced motion: one quiet fade for every cue**, no sparkles or shards. CSS only, in a
  `@media (prefers-reduced-motion: reduce)` block (AGENTS.md).
- **Flashcards' Clear saved progress brings it back** (maintainer, 2026-10-16): that
  button already means "start this deck as new", so it forgets the flag and this visit's
  turns too. A hard refresh does not: it leaves localStorage alone. Memory-match has no
  such button, so its cue stays retired.
- **Out:** a separate setting or button to bring the cue back; retiring it across a whole
  course; saving the turn count.

## 3. Units

| Unit                        | Kind    | Job                                                                                                                                                                                |
| --------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `flip-cue-exits.ts`         | pure    | `FLIP_CUE_EXIT_WEIGHTS`, `pickExit(random)`, `planExits(ids, random)` → each id's exit and delay                                                                                   |
| `flip-cue-store.ts`         | storage | `flipCueKey(base, progressId)`, `isFlipCueRetired(key)`, `retireFlipCue(key)`, `subscribe` — untrusted read, no-window safe, like `flashcards-storage.ts`                          |
| `useFlipCue.ts`             | hook    | the phase `shown` → `leaving` → `gone`; `recordTurn()` (true on the turn that retires it), `finishLeaving()`; reads the store with `useSyncExternalStore`                          |
| `FlipCueContext.ts`         | context | `ExerciseHost` provides one per exercise; outside a host (an engine's own tests) the cue stays `shown` and turns do nothing                                                        |
| `FlipCue.tsx`               | view    | gains `exit`, `delayMs`, `onExitEnd`; renders `data-exit`, the pop's sparkles and the shatter's shards; `onExitEnd` fires on the triangle's own `animationend`, not its children's |
| `flip-cue.css`              | style   | one keyframe set per exit, the sparkles, the shards, the instruction glyph's fade, and the reduced-motion fade                                                                     |
| `ExerciseInstructions.tsx`  | view    | gains `flipGlyph: 'shown' \| 'leaving' \| 'gone'`, so the host can fade, then drop, the pointer                                                                                    |
| flashcards and memory-match | wiring  | call `recordTurn()` on a turn; on `true`, plan the exits; render no cue once `gone`                                                                                                |

## 4. Phase and hydration

The prerendered page and the first client render both say `shown`: the store's server
snapshot is "not retired" (`useSyncExternalStore`, as `useIsHydrated` does), and engines
render only after hydration anyway. A stored retirement turns the phase to `gone` on the
next render, so an instruction box can show its glyph for a moment on load. Accepted:
the cards themselves never flash.

The phase is the session's own `leaving` or `gone` once set, else `gone` if the store
says retired, else `shown`. Saving the flag at the third turn therefore does not cut the
exit short. The last exit to finish (the largest delay) calls `finishLeaving()`;
memory-match's Reset also calls it, so a new deck never replays the exit.

## 5. Verify

Unit tests for every unit but the hook (glue: the suite has no DOM); the engines'
tests render each phase through `FlipCueContext`. By hand in Chromium on the dev server: flashcards and memory-match,
light and dark, reduced motion on and off, a reload after retiring.
