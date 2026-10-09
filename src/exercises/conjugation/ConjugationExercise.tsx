/**
 * ConjugationExercise.tsx — engine #4.3 (design §5). The learner conjugates a verb by
 * typing each form into a paradigm grid: the left column gives the person/pronoun
 * (read-only), the right column is a typed input per row. Scoring family: blank-grading
 * (spec §7), answers TYPED and compared via normalizeAnswer (accent-strict) — the same
 * grading model as inline-gap, so this view is thin wiring over pure
 * `conjugation-grading.ts`.
 *
 *   - On Check, each filled row is graded; a wrong one gets <AnswerFeedback> under its
 *     input — a hint naming the error first, the answer on the second wrong Check
 *     (answer-feedback.ts, TODO §D15).
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
import type { UiStringsOverride } from '@/config/ui-strings';
import { AnswerFeedback } from '@/exercises/lib/AnswerFeedback';
import {
  firstMarkedReveal,
  type AnswerFeedback as Feedback,
} from '@/exercises/lib/answer-feedback';
import { canRevealAnswers } from '@/exercises/lib/reveal';
import { commitCheck, getInitialScoringState, type ScoringState } from '@/exercises/lib/scoring';
import { ExerciseFooter } from '@/exercises/lib/ExerciseFooter';
import { ResultSlot } from '@/exercises/lib/ResultSlot';
import { createExerciseReducer } from '@/exercises/lib/exerciseScaffold';
import { ProgressMeter } from '@/exercises/lib/ProgressMeter';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import { TARGET_LANG } from '@/lib/lang';
import { ConjugationExerciseConfigSchema, type ConjugationRow } from './conjugation-schema';
import { fillConjugationAnswers, gradeConjugation } from './conjugation-grading';
import './conjugation.css';

interface ConjugationState extends ScoringState {
  /** rowIndex → typed text. */
  values: Record<number, string>;
  /** rowIndex → the hint or revealed answer under a wrong answer (answer-feedback). */
  feedback: Record<number, Feedback>;
  /** rowIndex → wrong Checks so far: the first gets a hint, the second the answer. */
  misses: Record<number, number>;
}

/** Shared merge reducer (partial/function patch); answer fields are interdependent. */
const reducer = createExerciseReducer<ConjugationState>();

const buildState = (): ConjugationState => ({
  ...getInitialScoringState(),
  values: {},
  feedback: {},
  misses: {},
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
      // Editing a row after checking clears its old verdict + feedback.
      const checkedResults = { ...prev.checkedResults };
      const feedback = { ...prev.feedback };
      delete checkedResults[rowIndex];
      delete feedback[rowIndex];
      return { values, feedback, ...commitCheck(checkedResults) };
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
    const { checkedResults, feedback, misses } = gradeConjugation(
      rows,
      state.values,
      state.misses,
      options.caseSensitive,
    );
    dispatch({ ...commitCheck(checkedResults), feedback, misses });
  };

  const handleShowAnswers = () => {
    const { values, checkedResults } = fillConjugationAnswers(rows);
    dispatch({ values, ...commitCheck(checkedResults), feedback: {} });
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
  const canReveal = canRevealAnswers({
    allowShowAnswers: options.allowShowAnswers,
    hasAttempted: state.hasChecked,
    total: nToSolve,
    nCorrect: state.nCorrect,
  });

  const heading = content.tense ? `${content.verb} — ${content.tense}` : content.verb;

  // The one-line key under the first revealed answer with something marked.
  const keyIndex = firstMarkedReveal(state.feedback);

  const renderRow = (row: ConjugationRow, rowIndex: number): ReactNode => {
    const value = state.values[rowIndex] ?? '';
    const result = state.checkedResults[rowIndex];
    const feedback = state.feedback[rowIndex];
    const isWrong = state.hasChecked && result === false;
    const isRight = state.hasChecked && result === true;
    const attempted = value.trim() !== '';
    const hasResult = state.hasChecked && attempted && typeof result === 'boolean';
    const id = inputId(rowIndex);

    return (
      // Columns from conjugation.css: the pronoun above the input while the exercise is
      // narrow, beside it from 30rem (TODO §D13).
      <div
        key={id}
        className="conjugation-row grid items-start gap-3 rounded-lg border border-border/70 bg-card px-4 py-3"
      >
        <span
          className="conjugation-person self-center font-medium text-muted-foreground"
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
          {state.hasChecked && feedback ? (
            <AnswerFeedback
              feedback={feedback}
              contentLang={TARGET_LANG}
              labels={labels}
              showKey={rowIndex === keyIndex}
            />
          ) : null}
        </span>
        <span className="self-center">
          <ResultSlot hasResult={hasResult} isCorrect={isRight} />
        </span>
      </div>
    );
  };

  return (
    <div className="conjugation flex flex-col gap-4">
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

      <ProgressMeter correct={state.nCorrect} total={nToSolve} labels={labels} />

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
