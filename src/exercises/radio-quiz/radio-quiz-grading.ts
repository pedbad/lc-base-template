/**
 * radio-quiz-grading.ts — pure grading for the multiple-choice question engine
 * (#3). Extracted from RadioQuizExercise's handleCheck / handleShowAnswers so the
 * compute is testable without a DOM. The component keeps the reducer/dispatch and
 * the option-shuffle that produces each question's `winnerIndex`; it passes the
 * winner-bearing prepared questions in here.
 *
 * A question grades correct when the selected option index equals its winnerIndex.
 * gradeRadioQuiz skips unanswered questions; fillRadioAnswers reveals every winner.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7, §8.
 */

/** The only field grading needs from a prepared question: where the winner landed. */
export interface GradableQuestion {
  winnerIndex: number;
}

/**
 * Grade selected option indices against each question's winnerIndex. Questions with
 * no selection (undefined) are skipped — only answered questions appear.
 */
export function gradeRadioQuiz(
  questions: readonly GradableQuestion[],
  values: Record<number, number>,
): Record<number, boolean> {
  const checkedResults: Record<number, boolean> = {};
  for (let i = 0; i < questions.length; i += 1) {
    const value = values[i];
    if (value === undefined) continue;
    checkedResults[i] = value === questions[i].winnerIndex;
  }
  return checkedResults;
}

/**
 * Reveal every answer: set each question's value to its winnerIndex and mark all
 * correct.
 */
export function fillRadioAnswers(questions: readonly GradableQuestion[]): {
  values: Record<number, number>;
  checkedResults: Record<number, boolean>;
} {
  const values: Record<number, number> = {};
  const checkedResults: Record<number, boolean> = {};
  for (let i = 0; i < questions.length; i += 1) {
    values[i] = questions[i].winnerIndex;
    checkedResults[i] = true;
  }
  return { values, checkedResults };
}
