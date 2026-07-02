# Handover — Per-exercise instructions box

**Status:** spec, not started
**Author:** session 2026-07-02
**Scope:** add an info-alert instruction box above every exercise engine.

---

## 1. Goal

Every exercise should show a short instruction box (info alert) telling the
learner **what to do** and **which buttons to use** (Check / Reset / Show
answers). Currently no such box exists anywhere: not in schema, not in any
engine, not in the showcase. The `src/components/ui/alert.tsx` component exists
but is unused — reuse it.

## 2. Locked decisions

1. **Source:** auto default per engine type **+** optional author override.
   - Each engine type has built-in default copy.
   - An optional `instructions` field per exercise overrides the default.
   - `instructions: ""` (empty string) or explicit `null` → render nothing
     (lets an author suppress the box). `undefined`/absent → use the default.
2. **Wording:** references the **task + the buttons** (name Check / Reset /
   Show answers), mirroring the French LO.
3. **Copy:** neutral English, drafted below (§6).

## 3. Architecture

Render the box at the **host level**, not inside all 12 engines, so wiring is
2 touch-points instead of 12.

- Hosts that render an exercise:
  - the showcase page (`src/showcase/*` — maps `SHOWCASE_FIXTURES` to engines),
  - the real LO runtime render point (whatever renders via
    `src/exercises/lazyRegistry.ts`).
- Each host already knows the exercise `type` and its parsed `config`, so it can
  compute the instruction text and render `<ExerciseInstructions>` immediately
  above the lazy engine component.

If a single shared host wrapper does not exist, first extract one (preferred),
e.g. `ExerciseHost({ type, config })` that renders instructions + the engine.
Fall back to per-engine insertion ONLY if hosts genuinely diverge.

### New files

1. `src/exercises/lib/instructions.ts`
   - `export const EXERCISE_INSTRUCTIONS: Record<ExerciseType, string>` — default
     copy for all 12 keys in `EXERCISE_TYPE_KEYS` (keep the Record exhaustive so
     adding an engine without copy is a type error).
   - `export function resolveInstructions(type: ExerciseType, override?: string | null): string | null`
     - `override === ''` or `override === null` → `null` (suppress)
     - `typeof override === 'string' && override.trim() !== ''` → `override`
     - otherwise → `EXERCISE_INSTRUCTIONS[type]`
2. `src/exercises/lib/ExerciseInstructions.tsx`
   - Presentational. Props: `{ text: string | null }`. Returns `null` when
     `text` is null/empty.
   - Renders `ui/alert` (info variant) with an `Info` lucide icon
     (`import { Info } from 'lucide-react'`).
   - `role="note"`, and the alert text is course-author English chrome — do NOT
     put `lang={TARGET_LANG}` on it (same rule as ChoicePillGroup group labels).
   - Bold the button names (`Check`, `Reset`, `Show answers`) via `<strong>` or a
     muted-strong span so they read as UI references.

### Schema change

- Add an optional `instructions` field to each engine's **content** schema, OR
  add it once to a shared content base the engines extend. Prefer a shared
  helper so all 12 stay consistent:
  - `instructions: z.string().optional()` (allow `''` to mean "suppress").
- The manifest-level `ExerciseConfigSchema.content` is `z.looseObject({})`, so no
  manifest change is needed; the field is validated inside each engine's content
  schema.

## 4. Button-reference caveat (IMPORTANT)

Copy must name only the buttons an engine actually shows:

- Standard engines show **Check / Reset / Show answers** (Show answers is gated
  by `options.allowShowAnswers` + the §5.3 reveal gate). Copy may still mention
  Show answers generically.
- **memory-match** self-checks as you flip; it does **not** use Check/Show
  answers the same way. Its copy references only **Reset**. Verify against
  `MemoryMatchExercise.tsx` before finalising.
- Any engine run with `allowShowAnswers: false` still shows the default copy;
  that is acceptable (the sentence is generic). Do not try to vary copy by
  runtime option.

## 5. File-by-file task list

1. `src/exercises/lib/instructions.ts` — new (map + resolver).
2. `src/exercises/lib/ExerciseInstructions.tsx` — new (alert component).
3. Host wiring — render `<ExerciseInstructions text={resolveInstructions(type, config.content.instructions)} />`
   above the engine in the showcase host and the LO runtime host.
4. Engine content schemas — add optional `instructions` (shared helper if
   feasible). 12 files under `src/exercises/*/*-schema.ts`.
5. `src/showcase/fixtures.ts` — leave defaults to auto-render; add one fixture
   with an explicit `instructions` override to prove the override path.
6. Tests:
   - `instructions.test.ts` — map has all `EXERCISE_TYPE_KEYS`; resolver: default
     when absent, override when set, null when `''`/`null`.
   - `ExerciseInstructions.test.tsx` — renders text; renders nothing when null;
     button names present.
   - update `lazyRegistry.test.ts` only if the host wrapper changes its surface.
7. `bunx tsc --noEmit` + `bunx vitest run` green; verify in showcase.

## 6. Draft default copy (neutral English, task + buttons)

> Bold the button names in render. Adjust to each engine's real controls (§4).

- **select:** "Choose the correct option for each gap from the drop-down menus. Select **Check** to mark your answers, **Reset** to start over, or **Show answers** to reveal the correct choices."
- **inline-choice:** "Pick the correct option for each gap. Select **Check** to mark your answers, **Reset** to clear them, or **Show answers** to reveal the correct choices."
- **radio-quiz:** "Select one answer for each question. Choose **Check** to mark your answers, **Reset** to clear them, or **Show answers** to reveal the correct choices."
- **inline-gap:** "Type your answer into each gap; press Enter to jump to the next one. Select **Check** to mark your answers, **Reset** to clear them, or **Show answers** to reveal the correct answers."
- **typed-transform:** "Rewrite each sentence in the box as instructed. Select **Check** to mark your answers, **Reset** to clear them, or **Show answers** to reveal the correct answers."
- **dictation:** "Play the audio and type what you hear. Select **Check** to mark your answers, **Reset** to clear them, or **Show answers** to reveal the correct text."
- **word-order:** "Drag or click the words to arrange them into the correct sentence. Select **Check** to mark your answer, **Reset** to start over, or **Show answers** to reveal the correct order."
- **phrase-reorder:** "Put the phrases in the correct order. Select **Check** to mark your answer, **Reset** to start over, or **Show answers** to reveal the correct order."
- **drag-fill-gaps:** "Drag each word into the gap where it belongs. Select **Check** to mark your answers, **Reset** to return the words, or **Show answers** to reveal the correct placement."
- **line-match:** "Match each item on the left with its pair on the right. Select **Check** to mark your matches, **Reset** to clear them, or **Show answers** to reveal the correct pairs."
- **memory-match:** "Flip the cards two at a time to find the matching pairs. Matches are kept automatically; select **Reset** to shuffle and start again."
- **word-spot:** "Click every part of the text that matches the target. Select **Check** to mark your selection, **Reset** to clear it, or **Show answers** to reveal the correct parts."

## 7. Acceptance criteria

- Every showcase exercise shows an info box with correct task + button copy.
- Author override replaces the default; `''`/`null` suppresses the box.
- Button names in copy match the engine's actual footer controls.
- Instruction text is NOT tagged `lang={TARGET_LANG}` (author chrome).
- `EXERCISE_INSTRUCTIONS` is exhaustive over `EXERCISE_TYPE_KEYS` (type-enforced).
- tsc + vitest green.
