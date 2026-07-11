/**
 * ConjugationExercise.tsx — engine #4.3 (design §5). The learner conjugates a verb by
 * typing each form into a paradigm grid: the left column gives the person/pronoun
 * (read-only), the right column is a typed input per row. Scoring family: blank-grading
 * (spec §7), answers TYPED and compared via normalizeAnswer (accent-strict) — the same
 * grading model as inline-gap, so this view is thin wiring over pure
 * `conjugation-grading.ts`.
 *
 *   - On Check, each filled row is graded and a character diff (diffChars) renders under
 *     the input via <TextDiff> (plain React nodes, no innerHTML).
 *   - shared shell: ExerciseFooter (Check/Reset/Show-answers) + ResultSlot (per-row
 *     tick/cross). canRevealAnswers gates Show-answers (spec §5.3). Reset clears all.
 *   - chrome text via resolveLabel(key, labels) (ui-strings §9).
 *
 * ANSWER MODE: the schema accepts `answerMode: 'typed' | 'choice'` (v2 forward-compat),
 * but this v1 view implements TYPED only. A `'choice'` config renders a clear notice
 * rather than silently degrading to typed inputs — the choice path (tap one of
 * `row.options`, reusing the radio-quiz option unit) lands in a follow-up.
 *
 * `options.shuffle`/`sampleSize` are N/A (a paradigm's row order is meaningful); only
 * `allowShowAnswers` applies.
 *
 * Spec: docs/specs/2026-07-03-new-exercise-engines-design.md §5; §7 (blank-grading).
 */
import { useId, useReducer, type KeyboardEvent, type ReactNode } from 'react';

import { Input } from '@/components/ui/input';
import AudioManager from '@/audio/AudioManager';
import { ExerciseOptionsSchema, type ExerciseOptions } from '@/config/lo-schema';
import { resolveLabel, type UiStringsOverride } from '@/config/ui-strings';
import { type DiffPart } from '@/exercises/lib/charDiff';
import { TextDiff } from '@/exercises/lib/TextDiff';
import { canRevealAnswers } from '@/exercises/lib/reveal';
import { commitCheck, getInitialScoringState, type ScoringState } from '@/exercises/lib/scoring';
import { ExerciseFooter } from '@/exercises/lib/ExerciseFooter';
import { ResultSlot } from '@/exercises/lib/ResultSlot';
import { createExerciseReducer } from '@/exercises/lib/exerciseScaffold';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import { TARGET_LANG } from '@/lib/lang';
import { ConjugationExerciseConfigSchema, type ConjugationRow } from './conjugation-schema';
import { fillConjugationAnswers, gradeConjugation } from './conjugation-grading';

interface ConjugationState extends ScoringState {
  /** rowIndex → typed text. */
  values: Record<number, string>;
  /** rowIndex → character diff parts (filled on Check / Show-answers). */
  diffs: Record<number, DiffPart[]>;
}

/** Shared merge reducer (partial/function patch); answer fields are interdependent. */
const reducer = createExerciseReducer<ConjugationState>();

const buildState = (): ConjugationState => ({
  ...getInitialScoringState(),
  values: {},
  diffs: {},
});

export default function ConjugationExercise({ config }: ExerciseComponentProps) {
  const uid = useId();

  const parsed = ConjugationExerciseConfigSchema.safeParse(config);
  const content = parsed.success ? parsed.data.content : null;
  const rows: readonly ConjugationRow[] = content?.rows ?? [];
  const labels: UiStringsOverride | undefined = parsed.success ? parsed.data.labels : undefined;
  const options: ExerciseOptions = ExerciseOptionsSchema.parse(
    parsed.success ? (parsed.data.options ?? {}) : {},
  );

  const [state, dispatch] = useReducer(reducer, undefined, buildState);

  const inputId = (rowIndex: number) => `${uid}-conj-${rowIndex}`;

  const handleInputChange = (rowIndex: number, value: string) => {
    dispatch((prev) => {
      const values = { ...prev.values, [rowIndex]: value };
      if (!prev.hasChecked) return { values };
      // Editing a row after checking clears its old verdict + diff.
      const checkedResults = { ...prev.checkedResults };
      const diffs = { ...prev.diffs };
      delete checkedResults[rowIndex];
      delete diffs[rowIndex];
      return { values, diffs, ...commitCheck(checkedResults) };
    });
  };

  // Enter advances to the next row's input instead of submitting the whole exercise.
  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>, rowIndex: number) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const next = document.getElementById(inputId(rowIndex + 1));
    if (next instanceof HTMLElement) next.focus();
    else event.currentTarget.blur();
  };

  const handleReset = () => {
    AudioManager.stopAll();
    dispatch(buildState());
  };

  const handleCheck = () => {
    const { checkedResults, diffs } = gradeConjugation(rows, state.values);
    dispatch({ ...commitCheck(checkedResults), diffs });
  };

  const handleShowAnswers = () => {
    const { values, checkedResults, diffs } = fillConjugationAnswers(rows);
    dispatch({ values, ...commitCheck(checkedResults), diffs });
  };

  if (!parsed.success || !content) {
    return (
      <p className="text-sm text-destructive">
        Invalid <code>conjugation</code> config:{' '}
        {parsed.success ? 'no content' : (parsed.error.issues[0]?.message ?? 'parse error')}
      </p>
    );
  }

  // v1 implements the typed paradigm only; a choice-mode config is surfaced, not
  // silently rendered as typed inputs (the choice path lands in a follow-up).
  if (content.answerMode === 'choice') {
    return (
      <p className="text-sm text-muted-foreground">
        This conjugation exercise is authored for choice mode, which isn’t available yet.
      </p>
    );
  }

  const nToSolve = rows.length;
  const hasInput = Object.values(state.values).some((v) => v.trim() !== '');
  const allCorrect = state.hasChecked && nToSolve > 0 && state.nCorrect === nToSolve;
  const canReveal = canRevealAnswers({
    allowShowAnswers: options.allowShowAnswers,
    hasAttempted: state.hasChecked,
    total: nToSolve,
    nCorrect: state.nCorrect,
  });

  const heading = content.tense ? `${content.verb} — ${content.tense}` : content.verb;

  const renderRow = (row: ConjugationRow, rowIndex: number): ReactNode => {
    const value = state.values[rowIndex] ?? '';
    const result = state.checkedResults[rowIndex];
    const diff = state.diffs[rowIndex];
    const isWrong = state.hasChecked && result === false;
    const isRight = state.hasChecked && result === true;
    const attempted = value.trim() !== '';
    const hasResult = state.hasChecked && attempted && typeof result === 'boolean';
    const id = inputId(rowIndex);

    return (
      <div
        key={id}
        className="grid grid-cols-[minmax(5rem,8rem)_minmax(0,1fr)_2.5rem] items-start gap-3 rounded-lg border border-border/70 bg-card px-4 py-3"
      >
        <span
          className="self-center text-right font-medium text-muted-foreground"
          lang={TARGET_LANG}
        >
          {row.person}
        </span>
        <span className="flex flex-col">
          <label className="sr-only" htmlFor={id}>{`Conjugated form for ${row.person}`}</label>
          <Input
            id={id}
            type="text"
            lang={TARGET_LANG}
            value={value}
            onChange={(event) => handleInputChange(rowIndex, event.target.value)}
            onKeyDown={(event) => handleInputKeyDown(event, rowIndex)}
            placeholder="Type…"
            aria-invalid={isWrong}
            className={`h-9 cursor-text transition-colors hover:border-primary/60 hover:bg-muted/40 ${isRight ? 'border-success' : ''}`}
          />
          {state.hasChecked && diff ? (
            <span className="mt-1" lang={TARGET_LANG}>
              <TextDiff parts={diff} />
            </span>
          ) : null}
        </span>
        <span className="self-center">
          <ResultSlot hasResult={hasResult} isCorrect={isRight} />
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground" lang={TARGET_LANG}>
          {heading}
        </h3>
        {content.prompt ? (
          <p className="mt-1 text-sm text-muted-foreground" lang={TARGET_LANG}>
            {content.prompt}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">{rows.map(renderRow)}</div>

      {state.hasChecked ? (
        <p
          className={`text-sm font-medium ${allCorrect ? 'text-success' : 'text-muted-foreground'}`}
          role="status"
        >
          {allCorrect ? resolveLabel('correct', labels) : `${state.nCorrect} / ${nToSolve}`}
        </p>
      ) : null}

      <ExerciseFooter
        onCheck={handleCheck}
        checkDisabled={!hasInput}
        onReset={handleReset}
        showReset={hasInput || state.hasChecked}
        onShowAnswers={handleShowAnswers}
        showAnswers={canReveal}
        labels={labels}
      />

      {content.footnote ? (
        <p className="text-sm text-muted-foreground" lang={TARGET_LANG}>
          {content.footnote}
        </p>
      ) : null}
    </div>
  );
}
