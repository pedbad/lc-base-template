/**
 * word-spot-grading.ts — pure logic for the word-spot engine (#8): building the
 * clickable render model (which part-words are bracketed targets vs distractors) and
 * scoring the learner's marks (hits on targets, misses on distractors, completion).
 * Extracted from WordSpotExercise so target-extraction and scoring are testable
 * without a DOM; the component keeps the marks reducer and rendering.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7, §8.
 */
import { decodeHtmlEntities } from '@/exercises/lib/html';
import { parseSentence, type TextSegment } from '@/exercises/lib/parsing';
import type { WordSpotContent } from './word-spot-schema';

/** A marked part-word: a hit (correct target) or a miss (clicked distractor). */
export type Mark = 'hit' | 'miss';

/** One clickable part-word: its stable state key, display text, and whether it scores. */
export interface ClickableToken {
  key: string;
  text: string;
  isTarget: boolean;
}

/** A rendered phrase: optional audio plus an ordered list of spans (clickable or space). */
export interface RowModel {
  audio?: string;
  nodes: Array<
    { kind: 'space'; key: string; text: string } | { kind: 'token'; token: ClickableToken }
  >;
}

/** The parser segment a bracketed target yields (the only blank kind word-spot needs). */
interface TargetSegment {
  type: 'target';
  key: string;
  value: string;
}

/**
 * Build the render model + the list of all target keys, in one pass over the items.
 * Bracketed runs become target tokens; plain text is split into word tokens (misses)
 * and whitespace nodes. Keys are namespaced by row so they stay globally unique.
 */
export function buildModel(content: WordSpotContent): { rows: RowModel[]; targetKeys: string[] } {
  const rows: RowModel[] = [];
  const targetKeys: string[] = [];
  let blankIndex = 0;

  content.items.forEach((item, rowIndex) => {
    const { segments, nextBlankIndex } = parseSentence<{ value: string }, TargetSegment>(
      item.text,
      {
        startBlankIndex: blankIndex,
        parseBlank: (rawInner, idx) => {
          const value = decodeHtmlEntities(rawInner.trim());
          return { meta: { value }, segment: { type: 'target', key: `t-${idx}`, value } };
        },
      },
    );
    blankIndex = nextBlankIndex;

    const nodes: RowModel['nodes'] = [];
    segments.forEach((segment) => {
      if ((segment as TargetSegment).type === 'target') {
        const target = segment as TargetSegment;
        targetKeys.push(target.key);
        nodes.push({
          kind: 'token',
          token: { key: target.key, text: target.value, isTarget: true },
        });
        return;
      }
      // A literal text run: split into words (clickable misses) and whitespace.
      const text = (segment as TextSegment).value;
      text.split(/(\s+)/).forEach((piece, pieceIndex) => {
        if (!piece) return;
        const key = `r${rowIndex}-${(segment as TextSegment).key}-${pieceIndex}`;
        if (piece.trim() === '') {
          nodes.push({ kind: 'space', key, text: piece });
        } else {
          nodes.push({ kind: 'token', token: { key, text: piece, isTarget: false } });
        }
      });
    });

    rows.push({ audio: item.audio, nodes });
  });

  return { rows, targetKeys };
}

export interface WordSpotScore {
  /** Correctly-clicked targets. */
  hits: number;
  /** Clicked distractors. */
  misses: number;
  /** Total targets to find. */
  total: number;
  /** All targets found. */
  complete: boolean;
  /** At least one hit or miss has been made. */
  hasAttempted: boolean;
}

/**
 * Derive the score from the marks map and the set of target keys. `hits` counts only
 * marks that are 'hit' AND belong to a real target (defensive); `misses` counts every
 * 'miss' mark.
 */
export function scoreWordSpot(
  marks: Record<string, Mark>,
  targetKeys: readonly string[],
): WordSpotScore {
  const total = targetKeys.length;
  const targetSet = new Set(targetKeys);
  const hits = Object.entries(marks).filter(
    ([key, mark]) => mark === 'hit' && targetSet.has(key),
  ).length;
  const misses = Object.values(marks).filter((mark) => mark === 'miss').length;
  return {
    hits,
    misses,
    total,
    complete: hits === total,
    hasAttempted: hits + misses > 0,
  };
}
