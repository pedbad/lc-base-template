/**
 * ExerciseHost.tsx — the shared render point for a single exercise.
 *
 * One place that turns an exercise (`type` + parsed `config`) into rendered UI: the
 * instruction box (ExerciseInstructions) above the lazily-loaded engine resolved
 * through the lazy-registry. Both hosts render through this — the showcase today, and
 * the real LO runtime when it lands — so the instruction wiring is defined once, not
 * per engine.
 *
 * `config` is `unknown` (the same shape each engine receives). The host reads only
 * `content.instructions` off it to compute the box text; everything else is passed
 * straight through to the engine untouched.
 *
 * It also owns the exercise's flip-cue phase (useFlipCue, TODO §E21) and shares it
 * through FlipCueContext, so the instruction box drops its Tap to flip pointer at the
 * moment the flip engine below retires its corners.
 *
 * Spec: docs/process/2026-07-02-instructions-box-handover.md §3.
 */
import { Suspense } from 'react';

import { type ExerciseType } from '@/config/exercise-types';
import { getExercise } from '@/exercises/lazy-registry';
import { useIsHydrated } from '@/hooks/useIsHydrated';
import { ExerciseErrorBoundary } from './ExerciseErrorBoundary';
import { ExerciseInstructions } from './ExerciseInstructions';
import { FlipCueContext } from './FlipCueContext';
import { useFlipCue } from './useFlipCue';
import { resolveInstructions, savesProgress } from './instructions';

interface ExerciseHostProps {
  /** The engine type; selects the engine and the default instruction copy. */
  type: ExerciseType;
  /** The validated exercise config, passed through to the engine as-is. */
  config: unknown;
  /** Where the exercise lives, for saved progress; passed through to the engine. */
  progressId?: string;
}

/** Safely read `content.instructions` off an unknown config (author override). */
function readInstructionsOverride(config: unknown): string | null | undefined {
  if (typeof config !== 'object' || config === null) return undefined;
  const content = (config as { content?: unknown }).content;
  if (typeof content !== 'object' || content === null) return undefined;
  const value = (content as { instructions?: unknown }).instructions;
  if (value === null || typeof value === 'string') return value;
  return undefined;
}

export function ExerciseHost({ type, config, progressId }: ExerciseHostProps) {
  // getExercise returns a stable, module-level lazy component from the registry —
  // it is not created per render, so the static-components rule is a false positive.
  const Engine = getExercise(type);
  const instructions = resolveInstructions(type, readInstructionsOverride(config), {
    // An engine saves only when told where it lives (E13a), so promise nothing without.
    savesProgress: savesProgress(config) && progressId !== undefined,
  });
  // Engines are lazy imports, which cannot resolve during a static render: the
  // boundary would fail server-side and the client would throw its HTML away (React
  // error #419). So the static page carries the honest statement instead — which is
  // also exactly what a reader with JavaScript off needs to be told, since no
  // exercise can work without it. Non-hydrating roots never see this branch.
  const isHydrated = useIsHydrated();
  const flipCue = useFlipCue(progressId);

  // Every engine spans the column, like the instruction box above it. §D11 held them
  // to a 48rem track (widgets sized `width: 100%` stretched into empty space at the
  // 72rem frame); the maintainer moved them off it engine by engine (§D12, 2026-10-07/08)
  // and the track went with the last four on 2026-10-08 (§D13). How each one uses the
  // width — and which inputs grow with it, by the maintainer's choice — lives in its
  // own CSS; do not bring back a shared cap to "fix" a wide row.
  return (
    <FlipCueContext value={flipCue}>
      <div>
        <ExerciseInstructions text={instructions} flipGlyph={flipCue.phase} />
        {Engine ? (
          isHydrated ? (
            // e2e/support.ts's exampleReady waits for no "Loading…" fallback and no error
            // alert left, so rewording this text must update it too. The boundary
            // catches a chunk that fails to load or an engine that throws (TODO §E13b).
            <ExerciseErrorBoundary>
              <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
                {/* eslint-disable-next-line react-hooks/static-components */}
                <Engine config={config} progressId={progressId} />
              </Suspense>
            </ExerciseErrorBoundary>
          ) : (
            <p className="text-muted-foreground">This exercise needs JavaScript to run.</p>
          )
        ) : (
          <p className="text-destructive">
            No engine registered for type <code>{type}</code>.
          </p>
        )}
      </div>
    </FlipCueContext>
  );
}
