/**
 * RadioQuizExercise.tsx — engine #3 of 12 (spec §2, §8). The learner answers
 * multiple-choice QUESTIONS: each question is a stem (`prompt`) with an `options[]`
 * radio-pill group, exactly one option correct. NOT blanks-in-a-sentence (that is
 * select #1 / inline-choice #2) — but the SAME scoring family, blank-grading (spec
 * §7): one gradeable "blank" per question, keyed by question index.
 *
 * Ported from french-lo-1's RadioQuiz.jsx, typed and trimmed to the template's
 * shared shell. Reused from the shell (no re-extraction):
 *   - ChoicePillGroup (role=radiogroup/radio pills, arrow-keys, roving tabIndex,
 *     state→token classes) — radio-quiz was the second consumer that made it shared.
 *   - scoring (getInitialScoringState/commitCheck, §7), canRevealAnswers (§5.3),
 *     ExerciseFooter (Check/Reset/Show-answers), shuffle/mulberry32 (§5.2),
 *     resolveLabel for all chrome text (ui-strings §9).
 *
 * Engine-specific bits:
 *   - Option order: when `options.shuffle` is on, each question's options are
 *     shuffled independently with a seeded mulberry32 (Reset bumps the seed → fresh
 *     order), tracking the `*` winner through the shuffle. This does NOT use
 *     prepareChoiceItems: that helper shuffles `[a|*b|c]` blanks INSIDE a `text`
 *     field and the items themselves; radio-quiz options are a plain array, a
 *     different shape, and question order is left as authored (only options shuffle).
 *   - Explanation reveal: a question's `explanation` shows after Check ONLY when that
 *     question is WRONG (matches french). It is DERIVED from checkedResults — no
 *     extra state field — so a re-answer (which clears that verdict) or Show-answers
 *     (which marks everything correct) hides it automatically.
 *   - Layout: stem above, ChoicePillGroup below, and a fixed-width ResultSlot column
 *     on the right (`grid-cols-[minmax(0,1fr)_2.5rem]`), so the tick/cross never
 *     shifts the card — the same no-jiggle row as select/inline.
 *
 * Deliberately NOT ported yet (YAGNI; see radio-quiz-schema.ts): the audio subsystem
 * (per-question `audio` accepted but unrendered), rich-HTML content (no DOMPurify),
 * french's ProgressDots (the local n/total status line covers it).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §5, §7, §8.
 */
import { useId, useReducer, type ReactNode } from 'react';

import { ExerciseOptionsSchema, type ExerciseOptions } from '@/config/lo-schema';
import { resolveLabel, type UiStringsOverride } from '@/config/ui-strings';
import { canRevealAnswers } from '@/exercises/lib/reveal';
import { commitCheck, getInitialScoringState, type ScoringState } from '@/exercises/lib/scoring';
import { mulberry32, shuffle } from '@/exercises/lib/shuffle';
import { ChoicePillGroup } from '@/exercises/lib/ChoicePillGroup';
import { ExerciseFooter } from '@/exercises/lib/ExerciseFooter';
import { ResultSlot } from '@/exercises/lib/ResultSlot';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import { TARGET_LANG } from '@/lib/lang';
import {
  RadioQuizExerciseConfigSchema,
  parseStarredOptions,
  type RadioQuizQuestion,
} from './radio-quiz-schema';
import { fillRadioAnswers, gradeRadioQuiz } from './radio-quiz-grading';

/** One question after option-shuffle: the labels to render + where the winner landed. */
interface PreparedQuestion {
  prompt: string;
  explanation?: string;
  /** Display labels (the `*` already stripped), in render order. */
  options: string[];
  /** Index of the correct option WITHIN `options` (after any shuffle). */
  winnerIndex: number;
}

interface RadioQuizState extends ScoringState {
  /** questionIndex → selected option index (within the prepared/display order). */
  values: Record<number, number>;
  /** The questions to render after option-shuffle (re-derived on reset). */
  preparedQuestions: PreparedQuestion[];
  /** RNG seed; bumped on reset so an `options.shuffle` exercise re-shuffles. */
  seed: number;
}

type RadioQuizPatch =
  | Partial<RadioQuizState>
  | ((state: RadioQuizState) => Partial<RadioQuizState>);

/** Merge reducer: each dispatch is a partial patch (answer fields are interdependent). */
const reducer = (state: RadioQuizState, patch: RadioQuizPatch): RadioQuizState => ({
  ...state,
  ...(typeof patch === 'function' ? patch(state) : patch),
});

/**
 * Prepare one question for render: strip the `*`, then (if shuffling) reorder the
 * options with the injected RNG while tracking where the winner moves to.
 */
const prepareQuestion = (
  question: RadioQuizQuestion,
  doShuffle: boolean,
  rng: () => number,
): PreparedQuestion => {
  const { labels, winnerIndex } = parseStarredOptions(question.options);

  if (!doShuffle) {
    return {
      prompt: question.prompt,
      explanation: question.explanation,
      options: labels,
      winnerIndex,
    };
  }

  // Carry a `win` flag through the shuffle so the winner is found at its new index.
  const shuffled = shuffle(
    labels.map((label, index) => ({ label, win: index === winnerIndex })),
    rng,
  );
  return {
    prompt: question.prompt,
    explanation: question.explanation,
    options: shuffled.map((entry) => entry.label),
    winnerIndex: shuffled.findIndex((entry) => entry.win),
  };
};

const buildState = (
  questions: readonly RadioQuizQuestion[],
  options: ExerciseOptions,
  seed: number,
): RadioQuizState => {
  // One RNG stream for the whole exercise: each question consumes draws in order, so
  // a given seed reproduces the same layout (and Reset's seed+1 gives a fresh one).
  const rng = mulberry32(seed);
  return {
    ...getInitialScoringState(),
    values: {},
    preparedQuestions: questions.map((question) => prepareQuestion(question, options.shuffle, rng)),
    seed,
  };
};

/**
 * FNV-1a hash → a stable numeric seed from the component's useId (pure; no
 * Math.random). Mirrors the helper in select/inline-choice; promote to lib if a
 * fourth consumer appears (rule of three already met, but extracting would touch the
 * shipped engines — out of scope for this port).
 */
const seedFromId = (id: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export default function RadioQuizExercise({ config }: ExerciseComponentProps) {
  const uid = useId();

  const parsed = RadioQuizExerciseConfigSchema.safeParse(config);
  const questions: readonly RadioQuizQuestion[] = parsed.success
    ? parsed.data.content.questions
    : [];
  const labels: UiStringsOverride | undefined = parsed.success ? parsed.data.labels : undefined;
  const options: ExerciseOptions = ExerciseOptionsSchema.parse(
    parsed.success ? (parsed.data.options ?? {}) : {},
  );

  // Seed from useId: stable across re-renders, distinct per instance. Reset bumps
  // the seed for a fresh option order.
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    buildState(questions, options, seedFromId(uid)),
  );

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

  const handleReset = () => {
    dispatch((prev) => buildState(questions, options, prev.seed + 1));
  };

  if (!parsed.success) {
    return (
      <p className="text-sm text-destructive">
        Invalid <code>radio-quiz</code> config: {parsed.error.issues[0]?.message ?? 'parse error'}
      </p>
    );
  }

  const nToSolve = state.preparedQuestions.length;

  const handleCheck = () => {
    dispatch(commitCheck(gradeRadioQuiz(state.preparedQuestions, state.values)));
  };

  const handleShowAnswers = () => {
    const { values, checkedResults } = fillRadioAnswers(state.preparedQuestions);
    dispatch({ values, ...commitCheck(checkedResults) });
  };

  const cards: ReactNode[] = state.preparedQuestions.map((question, questionIndex) => {
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

  const hasSelections = Object.keys(state.values).length > 0;
  const allCorrect = state.hasChecked && nToSolve > 0 && state.nCorrect === nToSolve;
  const canReveal = canRevealAnswers({
    allowShowAnswers: options.allowShowAnswers,
    hasAttempted: state.hasChecked,
    total: nToSolve,
    nCorrect: state.nCorrect,
  });

  return (
    <div className="flex flex-col gap-4">
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

      {parsed.data.content.footnote ? (
        <p className="text-sm text-muted-foreground" lang={TARGET_LANG}>
          {parsed.data.content.footnote}
        </p>
      ) : null}
    </div>
  );
}
