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
import { ExerciseInstructions } from './ExerciseInstructions';
import { resolveInstructions } from './instructions';

interface ExerciseHostProps {
  /** The engine type; selects the engine and the default instruction copy. */
  type: ExerciseType;
  /** The validated exercise config, passed through to the engine as-is. */
  config: unknown;
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

export function ExerciseHost({ type, config }: ExerciseHostProps) {
  // getExercise returns a stable, module-level lazy component from the registry —
  // it is not created per render, so the static-components rule is a false positive.
  const Engine = getExercise(type);
  const instructions = resolveInstructions(type, readInstructionsOverride(config));

  return (
    <>
      <ExerciseInstructions text={instructions} />
      {Engine ? (
        <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
          {/* eslint-disable-next-line react-hooks/static-components */}
          <Engine config={config} />
        </Suspense>
      ) : (
        <p className="text-destructive">
          No engine registered for type <code>{type}</code>.
        </p>
      )}
    </>
  );
}
