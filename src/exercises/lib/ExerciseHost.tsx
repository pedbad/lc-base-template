/**
 * ExerciseHost.tsx — the shared render point for a single exercise.
 *
 * One place that turns an exercise (`type` + parsed `config`) into rendered UI: the
 * instruction box (ExerciseInstructions) above the lazily-loaded engine resolved
 * through the lazyRegistry. Both hosts render through this — the showcase today, and
 * the real LO runtime when it lands — so the instruction wiring is defined once, not
 * per engine.
 *
 * `config` is `unknown` (the same shape each engine receives). The host reads only
 * `content.instructions` off it to compute the box text; everything else is passed
 * straight through to the engine untouched.
 *
 * Spec: docs/process/2026-07-02-instructions-box-handover.md §3.
 */
import { Suspense } from 'react';

import { type ExerciseType } from '@/config/exercise-types';
import { getExercise } from '@/exercises/lazyRegistry';
import { useIsHydrated } from '@/hooks/useIsHydrated';
import { ExerciseInstructions } from './ExerciseInstructions';
import { resolveInstructions } from './instructions';

interface ExerciseHostProps {
  /** The engine type; selects the engine and the default instruction copy. */
  type: ExerciseType;
  /** The validated exercise config, passed through to the engine as-is. */
  config: unknown;
}

/**
 * Engines that span the whole column, like the instruction box above them (maintainer,
 * 2026-10-07, engine by engine). select's dropdowns, the pills of inline-choice and
 * radio-quiz, and inline-gap's inputs (sized in `ch` from the answer) are fixed-width,
 * so their rows simply get longer. The answer inputs of typed-transform and dictation
 * DO grow with the table — longer boxes, the maintainer's call. line-match splits the
 * width into two equal halves with a gutter for its lines. memory-match's deck keeps
 * its 32rem cap and centres in the column (`margin: 0 auto`, memory-match.css). Every other engine stays on the track
 * (§D11: at the full column, `width: 100%` inputs went ~800px wide).
 */
const FULL_WIDTH_TYPES: ReadonlySet<ExerciseType> = new Set([
  'select',
  'inline-choice',
  'radio-quiz',
  'inline-gap',
  'typed-transform',
  'dictation',
  'line-match',
  'memory-match',
]);

/** Safely read `content.instructions` off an unknown config (author override). */
function readInstructionsOverride(config: unknown): string | null | undefined {
  if (typeof config !== 'object' || config === null) return undefined;
  const content = (config as { content?: unknown }).content;
  if (typeof content !== 'object' || content === null) return undefined;
  const value = (content as { instructions?: unknown }).instructions;
  if (value === null || typeof value === 'string') return value;
  return undefined;
}

export function ExerciseHost({ type, config }: ExerciseHostProps) {
  // getExercise returns a stable, module-level lazy component from the registry —
  // it is not created per render, so the static-components rule is a false positive.
  const Engine = getExercise(type);
  const instructions = resolveInstructions(type, readInstructionsOverride(config));
  // Engines are lazy imports, which cannot resolve during a static render: the
  // boundary would fail server-side and the client would throw its HTML away (React
  // error #419). So the static page carries the honest statement instead — which is
  // also exactly what a reader with JavaScript off needs to be told, since no
  // exercise can work without it. Non-hydrating roots never see this branch.
  const isHydrated = useIsHydrated();

  // The instruction box spans the column (maintainer's call, 2026-10-07); the engine
  // sits on the track unless it is in FULL_WIDTH_TYPES (layout.css, TODO §D11): most engines are rows sized
  // `width: 100%`, which stretch into empty space at the full page frame.
  return (
    <div>
      <ExerciseInstructions text={instructions} />
      <div className={FULL_WIDTH_TYPES.has(type) ? undefined : 'exercise-track'}>
        {Engine ? (
          isHydrated ? (
            <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
              {/* eslint-disable-next-line react-hooks/static-components */}
              <Engine config={config} />
            </Suspense>
          ) : (
            <p className="text-muted-foreground">This exercise needs JavaScript to run.</p>
          )
        ) : (
          <p className="text-destructive">
            No engine registered for type <code>{type}</code>.
          </p>
        )}
      </div>
    </div>
  );
}
