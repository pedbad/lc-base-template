/**
 * line-match-grading.ts — pure grading for the picture↔word match engine (#7).
 * Extracted from LineMatchExercise's handleCheck / handleShowAnswers so the compute
 * is testable without a DOM. A match is correct when the connected/selected word
 * shares the picture's key (lineMatchItemKey). On desktop a wrong connector recoils
 * and correct connectors are kept; on mobile only the verdict map matters.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7, §8.
 */
import { lineMatchItemKey, type LineMatchItem } from './line-match-schema';
import type { RecoilingConnection } from './LineMatchConnectors';

export interface LineMatchGradeResult {
  /** pictureKey → correct? Only answered pictures appear. */
  checkedResults: Record<string, boolean>;
  /** Desktop: wrong connectors to animate back to their picture. */
  recoiling: RecoilingConnection[];
  /** Desktop: correct connectors that stay drawn. */
  keptConnections: Record<string, string>;
}

/**
 * Grade the learner's answers (mobile `values` or desktop `connections`). Skips
 * pictures with no answer. On desktop, splits correct connectors (kept) from wrong
 * ones (recoiling); on mobile those two lists stay empty.
 */
export function gradeLineMatch(
  sampledItems: readonly LineMatchItem[],
  answers: Record<string, string>,
  isDesktop: boolean,
): LineMatchGradeResult {
  const checkedResults: Record<string, boolean> = {};
  const recoiling: RecoilingConnection[] = [];
  const keptConnections: Record<string, string> = {};

  for (const item of sampledItems) {
    const key = lineMatchItemKey(item);
    const picked = answers[key];
    if (!picked) continue;
    const correct = picked === key;
    checkedResults[key] = correct;
    if (isDesktop) {
      if (correct) keptConnections[key] = picked;
      else recoiling.push({ sourceId: key, targetId: picked });
    }
  }

  return { checkedResults, recoiling, keptConnections };
}

/**
 * Reveal every answer: connect/select each picture to its own word and mark all
 * correct (fills both the mobile `values` and desktop `connections` maps).
 */
export function fillLineMatchAnswers(sampledItems: readonly LineMatchItem[]): {
  values: Record<string, string>;
  connections: Record<string, string>;
  checkedResults: Record<string, boolean>;
} {
  const values: Record<string, string> = {};
  const connections: Record<string, string> = {};
  const checkedResults: Record<string, boolean> = {};
  for (const item of sampledItems) {
    const key = lineMatchItemKey(item);
    values[key] = key;
    connections[key] = key;
    checkedResults[key] = true;
  }
  return { values, connections, checkedResults };
}
