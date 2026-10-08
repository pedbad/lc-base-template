/**
 * answer-feedback.ts — what a learner is told after a wrong TYPED answer (maintainer,
 * 2026-10-08; TODO §D15). Pure, view-free; rendered by <AnswerFeedback>.
 *
 * WHY. The old feedback was a character diff weaving the typed text and the answer
 * into one string ("losgaterergeros" for `gtererger` → `los gatos`). It named no
 * error, was noise on a far miss, and gave the answer away on the first try, so the
 * learner copied instead of retrieving. Now:
 *   - first wrong Check  → a HINT naming the kind of error (accent, ending, missing
 *     letters, close, far); the answer stays hidden and the learner tries again;
 *   - REVEAL_AFTER_MISSES wrong Checks → the ANSWER, written as authored, with only the
 *     part that differs from the attempt marked — and nothing marked on a far miss,
 *     where marking nearly every letter teaches nothing.
 *
 * WHAT IS COMPARED (answerKey): the engine's normalizer (apostrophes, whitespace;
 * dictation also drops sentence punctuation), then capitals folded unless the author
 * sets `options.caseSensitive`. Accents always count (é ≠ e): an accent-only miss is
 * still wrong, but it is NAMED, so the learner knows exactly what to fix.
 */
import { normalizeAnswer, normalizeForDictation } from './answers';
import { diffChars } from './charDiff';

export type ComparisonMode = 'strict' | 'dictation';

/** Why a wrong answer is wrong, most specific first. */
export type MissReason = 'accent' | 'missing' | 'ending' | 'close' | 'far';

/** One run of the revealed answer: marked when it differs from the attempt. */
export interface AnswerSegment {
  text: string;
  differs: boolean;
}

export type AnswerFeedback =
  | { kind: 'hint'; reason: MissReason }
  | { kind: 'reveal'; answer: string; segments: readonly AnswerSegment[] };

/** Wrong Checks on one answer before it is revealed. One honest retry first. */
export const REVEAL_AFTER_MISSES = 2;

/** Below this similarity a miss is "far": no shared shape worth pointing at. */
export const CLOSE_SIMILARITY = 0.6;

/** An "ending" miss differs only in the last few letters of the last word. */
const MAX_ENDING_LENGTH = 3;
const MIN_SHARED_STEM = 2;

/** The string two answers are compared on. */
export function answerKey(value: string, mode: ComparisonMode, caseSensitive = false): string {
  const normalized = mode === 'dictation' ? normalizeForDictation(value) : normalizeAnswer(value);
  return caseSensitive ? normalized : normalized.toLowerCase();
}

/** Length of the longest common subsequence of two strings. */
function lcsLength(a: string, b: string): number {
  let previous = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i += 1) {
    const current = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j += 1) {
      current[j] =
        a[i - 1] === b[j - 1] ? previous[j - 1] + 1 : Math.max(previous[j], current[j - 1]);
    }
    previous = current;
  }
  return previous[b.length];
}

/** 2·LCS / (|a| + |b|): 1 for equal strings, 0 for nothing in common. */
export function similarity(a: string, b: string): number {
  const total = a.length + b.length;
  return total === 0 ? 1 : (2 * lcsLength(a, b)) / total;
}

/** The string with its accents and other combining marks removed. */
const stripAccents = (value: string): string => value.normalize('NFD').replace(/\p{M}/gu, '');

/** Length of the prefix two strings share. */
function sharedPrefix(a: string, b: string): number {
  let index = 0;
  while (index < a.length && index < b.length && a[index] === b[index]) index += 1;
  return index;
}

/**
 * Name the kind of miss between two compared strings (already through answerKey, or
 * plain lower-case text). Callers only ask about answers that are wrong.
 */
export function classifyMiss(typed: string, expected: string): MissReason {
  if (stripAccents(typed) === stripAccents(expected)) return 'accent';
  if (similarity(typed, expected) < CLOSE_SIMILARITY) return 'far';
  if (typed.length < expected.length && lcsLength(typed, expected) === typed.length) {
    return 'missing';
  }
  const stem = sharedPrefix(typed, expected);
  const typedTail = typed.slice(stem);
  const expectedTail = expected.slice(stem);
  const isLastWord = !typedTail.includes(' ') && !expectedTail.includes(' ');
  if (
    stem >= MIN_SHARED_STEM &&
    isLastWord &&
    typedTail.length <= MAX_ENDING_LENGTH &&
    expectedTail.length <= MAX_ENDING_LENGTH
  ) {
    return 'ending';
  }
  return 'close';
}

/**
 * The answer as authored (light-normalized, capitals kept), split into runs marked
 * where it differs from the attempt: a letter the learner got wrong or left out, or
 * the letter after one they added. Compared case-folded unless `caseSensitive`.
 */
export function answerSegments(
  typed: string,
  expected: string,
  caseSensitive = false,
): AnswerSegment[] {
  const answer = normalizeAnswer(expected);
  const fold = (value: string) => (caseSensitive ? value : value.toLowerCase());
  const target = fold(answer);
  // Folding can change a string's length in rare scripts; then mark nothing.
  if (target.length !== answer.length) return [{ text: answer, differs: false }];

  const differs = new Array<boolean>(answer.length).fill(false);
  let index = 0;
  let extraBefore = false;
  for (const part of diffChars(fold(normalizeAnswer(typed)), target).parts) {
    if (part.kind === 'deleted') {
      extraBefore = true;
      continue;
    }
    if (part.kind === 'inserted' || extraBefore) differs[index] = true;
    extraBefore = false;
    index += 1;
  }
  if (extraBefore && answer.length > 0) differs[answer.length - 1] = true;

  const segments: AnswerSegment[] = [];
  for (let i = 0; i < answer.length; i += 1) {
    const last = segments.at(-1);
    if (last && last.differs === differs[i]) {
      segments[segments.length - 1] = { ...last, text: last.text + answer[i] };
    } else {
      segments.push({ text: answer[i], differs: differs[i] });
    }
  }
  return segments;
}

/**
 * The feedback for one wrong answer after `misses` wrong Checks on it (this one
 * included): a hint until REVEAL_AFTER_MISSES, then the answer.
 */
export function feedbackFor(
  typed: string,
  expected: string,
  misses: number,
  mode: ComparisonMode = 'strict',
  caseSensitive = false,
): AnswerFeedback {
  const reason = classifyMiss(
    answerKey(typed, mode, caseSensitive),
    answerKey(expected, mode, caseSensitive),
  );
  if (misses < REVEAL_AFTER_MISSES) return { kind: 'hint', reason };
  const answer = normalizeAnswer(expected);
  return {
    kind: 'reveal',
    answer,
    segments:
      reason === 'far'
        ? [{ text: answer, differs: false }]
        : answerSegments(typed, expected, caseSensitive),
  };
}

export interface TypedGradeResult {
  /** index → correct? Only answers the learner filled are present. */
  checkedResults: Record<number, boolean>;
  /** index → what to show under a WRONG answer. Right answers get no line. */
  feedback: Record<number, AnswerFeedback>;
  /** index → wrong Checks so far on that answer, this one included. */
  misses: Record<number, number>;
}

/**
 * Grade one Check over a set of typed answers (rows, blanks). Empty answers are
 * skipped. Each wrong answer's miss count goes up by one and decides between a hint
 * and the revealed answer. The engines' own grading modules are thin wrappers.
 */
export function gradeTypedAnswers(
  expected: readonly string[],
  values: Readonly<Record<number, string>>,
  previousMisses: Readonly<Record<number, number>>,
  mode: ComparisonMode = 'strict',
  caseSensitive = false,
): TypedGradeResult {
  const checkedResults: Record<number, boolean> = {};
  const feedback: Record<number, AnswerFeedback> = {};
  const misses: Record<number, number> = { ...previousMisses };
  expected.forEach((answer, index) => {
    const value = values[index] ?? '';
    if (value.trim() === '') return; // grade only answers the learner filled
    const isCorrect =
      answerKey(value, mode, caseSensitive) === answerKey(answer, mode, caseSensitive);
    checkedResults[index] = isCorrect;
    if (isCorrect) return;
    misses[index] = (misses[index] ?? 0) + 1;
    feedback[index] = feedbackFor(value, answer, misses[index], mode, caseSensitive);
  });
  return { checkedResults, feedback, misses };
}

/** The first revealed answer with something marked: where the one-line key goes. */
export function firstMarkedReveal(
  feedback: Readonly<Record<number, AnswerFeedback>>,
): number | undefined {
  return Object.keys(feedback)
    .map(Number)
    .sort((a, b) => a - b)
    .find((index) => {
      const item = feedback[index];
      return item?.kind === 'reveal' && item.segments.some((segment) => segment.differs);
    });
}
