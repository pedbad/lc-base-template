/**
 * TypedTransformExercise.tsx — engine #5 of 12 (spec §2, §9). A thin wrapper over the
 * shared TextEntryRuntime: validates the `typed-transform` config and renders the
 * runtime in `strict` comparison mode. The learner types a transformed form (plural,
 * conjugation, agreement) for each prompt.
 *
 * Per spec §9 the typed-response runtime is shared with dictation (#6); the engines
 * differ only in `comparisonMode`. We port as-is on one runtime and split into
 * separate controllers only if the normalization rules actually diverge.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §8, §9.
 */
import { ExerciseOptionsSchema } from '@/config/lo-schema';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import { TextEntryRuntime } from '../text-entry/TextEntryRuntime';
import { TypedTransformExerciseConfigSchema } from './typed-transform-schema';

export default function TypedTransformExercise({ config }: ExerciseComponentProps) {
  const parsed = TypedTransformExerciseConfigSchema.safeParse(config);

  if (!parsed.success) {
    return (
      <p className="text-sm text-destructive">
        Invalid <code>typed-transform</code> config:{' '}
        {parsed.error.issues[0]?.message ?? 'parse error'}
      </p>
    );
  }

  const options = ExerciseOptionsSchema.parse(parsed.data.options ?? {});

  return (
    <TextEntryRuntime
      content={parsed.data.content}
      comparisonMode="strict"
      labels={parsed.data.labels}
      options={options}
    />
  );
}
