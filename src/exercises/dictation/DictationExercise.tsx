/**
 * DictationExercise.tsx — engine #6 of 12 (spec §2, §9). A thin wrapper over the
 * shared TextEntryRuntime: validates the `dictation` config and renders the runtime
 * in `dictation` comparison mode. The learner hears each clip and transcribes it.
 *
 * Per spec §9 this shares the runtime with typed-transform (#5); the only difference
 * is the comparison mode (normalizeForDictation — accent-strict, punctuation/quote
 * tolerant). That is a runtime flag, so no component-split is needed.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §8, §9.
 */
import { ExerciseOptionsSchema } from '@/config/lo-schema';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import { TextEntryRuntime } from '../text-entry/TextEntryRuntime';
import { DictationExerciseConfigSchema } from './dictation-schema';

export default function DictationExercise({ config }: ExerciseComponentProps) {
  const parsed = DictationExerciseConfigSchema.safeParse(config);

  if (!parsed.success) {
    return (
      <p className="text-sm text-destructive">
        Invalid <code>dictation</code> config: {parsed.error.issues[0]?.message ?? 'parse error'}
      </p>
    );
  }

  const options = ExerciseOptionsSchema.parse(parsed.data.options ?? {});

  return (
    <TextEntryRuntime
      content={parsed.data.content}
      comparisonMode="dictation"
      labels={parsed.data.labels}
      options={options}
    />
  );
}
