/**
 * ReadingExercise.tsx — engine #4.4 (reading comprehension, design §6). The learner
 * reads a lang-tagged `passage`, then answers a stacked set of comprehension
 * questions. COMPOSITE + blank-grading (spec §7): one gradeable "blank" per question,
 * keyed by question index, aggregated into a single score.
 *
 * v1 = MCQ + true/false ONLY (short-answer/typed parked). Both types render through
 * radio-quiz's ChoicePillGroup — a true-false question is a two-option radio
 * (trueLabel / falseLabel), NOT a bespoke widget. Grading is the pure
 * `reading-grading` module (prepare → delegate to radio-quiz's aggregate grader), so
 * this view is thin wiring:
 *   - shared shell: ExerciseFooter (Check/Reset/Show-answers) + ResultSlot (per-
 *     question tick/cross). canRevealAnswers gates Show-answers (spec §5.3).
 *   - explanation reveal: a question's `explanation` shows after Check ONLY when that
 *     question is WRONG — derived from checkedResults, no extra state (matches
 *     radio-quiz), so a re-answer or Show-answers hides it automatically.
 *   - chrome text via resolveLabel(key, labels) (ui-strings §9).
 *
 * `options.shuffle`/`sampleSize` are N/A (question + option order are authored — a
 * true-false must read True-then-False); only `allowShowAnswers` applies.
 *
 * Spec: docs/specs/2026-07-03-new-exercise-engines-design.md §6; §7 (blank-grading).
 */
import { useId, useReducer, type ReactNode } from 'react';

import { ExerciseOptionsSchema, type ExerciseOptions } from '@/config/lo-schema';
import { resolveLabel, type UiStringsOverride } from '@/config/ui-strings';
import { canRevealAnswers } from '@/exercises/lib/reveal';
import { commitCheck, getInitialScoringState, type ScoringState } from '@/exercises/lib/scoring';
import { ChoicePillGroup } from '@/exercises/lib/ChoicePillGroup';
import { ExerciseFooter } from '@/exercises/lib/ExerciseFooter';
import { ResultSlot } from '@/exercises/lib/ResultSlot';
import { createExerciseReducer } from '@/exercises/lib/exerciseScaffold';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import { TARGET_LANG } from '@/lib/lang';
import {
  DEFAULT_FALSE_LABEL,
  DEFAULT_TRUE_LABEL,
  ReadingExerciseConfigSchema,
} from './reading-schema';
import {
  fillReadingAnswers,
  gradeReading,
  prepareReadingQuestions,
  type PreparedReadingQuestion,
} from './reading-grading';

interface ReadingState extends ScoringState {
  /** questionIndex → selected option index. */
  values: Record<number, number>;
}

/** Shared merge reducer (partial/function patch); question verdicts are interdependent. */
const reducer = createExerciseReducer<ReadingState>();

const buildState = (): ReadingState => ({
  ...getInitialScoringState(),
  values: {},
});

/** Split the passage into paragraphs on blank lines; drop empties. */
const toParagraphs = (passage: string): string[] =>
  passage
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block !== '');

export default function ReadingExercise({ config }: ExerciseComponentProps) {
  const uid = useId();

  const parsed = ReadingExerciseConfigSchema.safeParse(config);
  const content = parsed.success ? parsed.data.content : null;
  const labels: UiStringsOverride | undefined = parsed.success ? parsed.data.labels : undefined;
  const options: ExerciseOptions = ExerciseOptionsSchema.parse(
    parsed.success ? (parsed.data.options ?? {}) : {},
  );

  const [state, dispatch] = useReducer(reducer, undefined, buildState);

  // Prepared questions are a pure function of content (no shuffle), so deriving them
  // each render is cheap and keeps them index-aligned with `values`.
  const prepared: PreparedReadingQuestion[] = content
    ? prepareReadingQuestions(
        content.questions,
        content.trueLabel ?? DEFAULT_TRUE_LABEL,
        content.falseLabel ?? DEFAULT_FALSE_LABEL,
      )
    : [];

  const handleChoiceChange = (questionIndex: number, optionIndex: number) => {
    dispatch((prev) => {
      const values = { ...prev.values, [questionIndex]: optionIndex };
      if (!prev.hasChecked) return { values };
      // A changed answer after checking clears that question's old verdict (and, by
      // derivation, its explanation).
      const checkedResults = { ...prev.checkedResults };
      delete checkedResults[questionIndex];
      return { values, ...commitCheck(checkedResults) };
    });
  };

  const handleReset = () => dispatch(buildState());

  const handleCheck = () => {
    dispatch(commitCheck(gradeReading(prepared, state.values)));
  };

  const handleShowAnswers = () => {
    const { values, checkedResults } = fillReadingAnswers(prepared);
    dispatch({ values, ...commitCheck(checkedResults) });
  };

  if (!parsed.success || !content) {
    return (
      <p className="text-sm text-destructive">
        Invalid <code>reading</code> config:{' '}
        {parsed.success ? 'no content' : (parsed.error.issues[0]?.message ?? 'parse error')}
      </p>
    );
  }

  const nToSolve = prepared.length;
  const hasSelections = Object.keys(state.values).length > 0;
  const allCorrect = state.hasChecked && nToSolve > 0 && state.nCorrect === nToSolve;
  const canReveal = canRevealAnswers({
    allowShowAnswers: options.allowShowAnswers,
    hasAttempted: state.hasChecked,
    total: nToSolve,
    nCorrect: state.nCorrect,
  });

  const paragraphs = toParagraphs(content.passage);

  const cards: ReactNode[] = prepared.map((question, questionIndex) => {
    const selectedIndex = state.values[questionIndex] ?? -1;
    const result = state.checkedResults[questionIndex];
    const verdict = typeof result === 'boolean' ? result : undefined;
    const hasResult = typeof result === 'boolean';
    const groupId = `${uid}-q-${questionIndex}`;
    // Explanation shows after a Check ONLY when this question is wrong (derived, no
    // extra state) — Show-answers marks everything correct, so it hides there.
    const showExplanation = result === false && Boolean(question.explanation);

    return (
      <div
        key={groupId}
        className="rounded-lg border border-border/70 bg-card px-4 py-3 leading-relaxed"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_2.5rem] items-start gap-2">
          <div className="min-w-0">
            <div className="text-base text-foreground" lang={TARGET_LANG}>
              {question.prompt}
            </div>
            <div className="mt-2">
              <ChoicePillGroup
                contentLang={TARGET_LANG}
                groupId={groupId}
                groupLabel={`Choose answer for question ${questionIndex + 1}`}
                onSelect={(optionIndex) => handleChoiceChange(questionIndex, optionIndex)}
                options={question.options}
                selectedIndex={selectedIndex}
                verdict={verdict}
              />
            </div>
            {showExplanation ? (
              <p className="mt-2 text-sm text-muted-foreground" lang={TARGET_LANG}>
                {question.explanation}
              </p>
            ) : null}
          </div>
          <ResultSlot hasResult={hasResult} isCorrect={verdict === true} />
        </div>
      </div>
    );
  });

  return (
    <div className="flex flex-col gap-4">
      <article
        className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-base leading-relaxed text-foreground"
        lang={TARGET_LANG}
      >
        {paragraphs.map((paragraph, index) => (
          <p key={`${uid}-p-${index}`} className={index > 0 ? 'mt-3' : undefined}>
            {paragraph}
          </p>
        ))}
      </article>

      <div className="space-y-3">{cards}</div>

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
        checkDisabled={!hasSelections}
        onReset={handleReset}
        showReset={hasSelections || state.hasChecked}
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
