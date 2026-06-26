/**
 * charDiff.ts — character-level diff between a typed answer and the expected text
 * (spec §8, "ported once"). Pure data, no rendering, no side effects. The renderer
 * is <TextDiff> (TextDiff.tsx); kept in a separate file so the component module
 * exports only a component (react-refresh) and to avoid a case-insensitive filename
 * clash with TextDiff.tsx.
 *
 * Ported from french-lo-1's utils/exerciseDiff.js, with two deliberate changes:
 *  - It returns typed `DiffPart[]` (rendered by <TextDiff>) instead of an HTML
 *    string, so the engine never touches `dangerouslySetInnerHTML`.
 *  - The audio playback the original wove in (ting/error sounds) is removed — a diff
 *    shouldn't have side effects; the engine owns any feedback.
 *
 * The diff is a longest-common-subsequence backtrack: characters in both strings are
 * `same`; a character only in `expected` is `inserted` (the learner missed it); a
 * character only in `actual` is `deleted` (the learner typed it wrongly).
 */

/** How a single character relates the typed answer to the expected text. */
export type DiffKind = 'same' | 'inserted' | 'deleted';

/** One character of a rendered diff. `key` is unique within a single diff result. */
export interface DiffPart {
  kind: DiffKind;
  /** For 'inserted' this is the expected char; for 'same'/'deleted' the typed char. */
  char: string;
  key: string;
}

export interface DiffResult {
  parts: DiffPart[];
  /** True when `actual` exactly equals `expected` (no inserted/deleted chars). */
  correct: boolean;
}

/**
 * Diff `actual` (what the learner typed) against `expected` (the answer). Pass
 * normalized strings for accent/whitespace tolerance — this does a strict character
 * comparison on whatever it is given.
 */
export function diffChars(actual: string = '', expected: string = ''): DiffResult {
  const a = `${actual}`;
  const b = `${expected}`;
  const m = a.length;
  const n = b.length;

  // LCS length table.
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      dp[i][j] =
        a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack from (m, n) collecting parts in reverse.
  const reversed: Array<Omit<DiffPart, 'key'>> = [];
  let i = m;
  let j = n;
  let correct = true;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      reversed.push({ kind: 'same', char: a[i - 1] });
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      reversed.push({ kind: 'inserted', char: b[j - 1] });
      correct = false;
      j -= 1;
    } else {
      reversed.push({ kind: 'deleted', char: a[i - 1] });
      correct = false;
      i -= 1;
    }
  }

  const parts = reversed
    .reverse()
    .map((part, index): DiffPart => ({ ...part, key: `${index}-${part.kind}` }));

  return { parts, correct };
}
