/**
 * reading-grading.ts — pure grading for the reading-comprehension engine (#4.4,
 * design §6). View-free so it is unit-testable without a DOM.
 *
 * Reading is COMPOSITE: each question is a multiple-choice unit, so the aggregate
 * scoring IS radio-quiz's per-question grading applied across the set. This module
 * owns only the reading-specific PREPARE step — turning each authored question
 * (radio or true-false) into the `{ options, winnerIndex }` shape the radio grader
 * needs — then DELEGATES the grade/fill to `radio-quiz-grading` (no re-derivation of
 * option matching, per design).
 *
 *   - radio:      options as authored; winner = index of `answer` within `options`.
 *   - true-false: options = [trueLabel, falseLabel]; winner = 0 (true) / 1 (false).
 *
 * Spec: docs/specs/2026-07-03-new-exercise-engines-design.md §6; §7 (blank-grading).
 */
import {
  fillRadioAnswers,
  gradeRadioQuiz,
  type GradableQuestion,
} from '@/exercises/radio-quiz/radio-quiz-grading';
import type { ReadingQuestion } from './reading-schema';

/** One question after preparation: the labels to render + where the winner is. */
export interface PreparedReadingQuestion extends GradableQuestion {
  /** The question stem / statement (target-language content). */
  prompt: string;
  /** Display labels for the radio pills, in render order. */
  options: string[];
  /** Index of the correct option within `options`. */
  winnerIndex: number;
  /** Optional note shown after a WRONG check. */
  explanation?: string;
}

/**
 * Prepare each authored question for render + grading: resolve its option labels and
 * the index of the correct one. true-false questions borrow the shared
 * `trueLabel`/`falseLabel`; radio questions map `answer` to its position in `options`.
 */
export function prepareReadingQuestions(
  questions: readonly ReadingQuestion[],
  trueLabel: string,
  falseLabel: string,
): PreparedReadingQuestion[] {
  return questions.map((question) => {
    if (question.type === 'true-false') {
      return {
        prompt: question.prompt,
        options: [trueLabel, falseLabel],
        winnerIndex: question.answer ? 0 : 1,
        explanation: question.explanation,
      };
    }
    return {
      prompt: question.prompt,
      options: [...question.options],
      winnerIndex: question.options.indexOf(question.answer),
      explanation: question.explanation,
    };
  });
}

/**
 * Grade selected option indices across all questions, aggregating one result per
 * question. Delegates to radio-quiz's grader — unanswered questions are skipped.
 */
export function gradeReading(
  questions: readonly GradableQuestion[],
  values: Record<number, number>,
): Record<number, boolean> {
  return gradeRadioQuiz(questions, values);
}

/** Reveal every answer: select each question's winner and mark all correct. */
export function fillReadingAnswers(questions: readonly GradableQuestion[]): {
  values: Record<number, number>;
  checkedResults: Record<number, boolean>;
} {
  return fillRadioAnswers(questions);
}
