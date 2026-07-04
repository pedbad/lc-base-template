/**
 * drag-fill-gaps-grading.ts — pure logic for the drag-fill-gaps engine (#12):
 * building the render model + tile bank from the bracketed sentences, ordering the
 * bank, and the Check "lock correct / bounce wrong" placement grading. Extracted
 * from DragFillGapsExercise so the placement logic is testable without a DOM; the
 * component keeps the reducer and drag/drop handlers.
 *
 * The Check twist (ported faithfully): each correctly-placed tile is LOCKED in its
 * slot and each wrong tile bounces back to the bank, so nCorrect only ever grows.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7, §8.
 */
import { shuffle } from '@/exercises/lib/shuffle';
import { parseSentence, type TextSegment } from '@/exercises/lib/parsing';
import type { DragFillGapsContent } from './drag-fill-gaps-schema';

/** One draggable word tile: a stable id (paired to its home slot) + the word. */
export interface Tile {
  id: string;
  word: string;
}

/** The blank segment `parseSentence` yields for a `[word]` token. */
export interface SlotSegment {
  type: 'slot';
  key: string;
  id: string;
}

/** A rendered sentence: optional audio + ordered text/slot segments. */
export interface RowModel {
  audio?: string;
  nodes: Array<TextSegment | SlotSegment>;
}

/** One pass over every item: collects the tile bank (blank order) + per-row render nodes. */
export function buildModel(content: DragFillGapsContent): { rows: RowModel[]; tiles: Tile[] } {
  const blanksMeta: Array<{ word: string }> = [];
  const rows: RowModel[] = [];
  let blankIndex = 0;

  content.items.forEach((item) => {
    const { segments, nextBlankIndex } = parseSentence<{ word: string }, SlotSegment>(item.text, {
      startBlankIndex: blankIndex,
      blanksMeta,
      parseBlank: (rawInner, idx) => {
        const id = `tile-${idx}`;
        return { meta: { word: rawInner.trim() }, segment: { type: 'slot', key: id, id } };
      },
    });
    blankIndex = nextBlankIndex;
    rows.push({ audio: item.audio, nodes: segments });
  });

  const tiles: Tile[] = blanksMeta.map((meta, index) => ({ id: `tile-${index}`, word: meta.word }));
  return { rows, tiles };
}

/** The bank's display order: the tile ids, shuffled when `shuffleBank` is on. */
export function bankOrderFor(
  tiles: readonly Tile[],
  shuffleBank: boolean,
  rng?: () => number,
): string[] {
  const ids = tiles.map((tile) => tile.id);
  return shuffleBank ? shuffle(ids, rng) : ids;
}

export interface CheckPlacementsResult {
  /** slotId → placed tileId or null, after wrong tiles bounce to the bank. */
  assignments: Record<string, string | null>;
  /** slotId → locked?, after correct tiles lock in place. */
  locked: Record<string, boolean>;
  /** True when at least one placed tile was wrong (drives the fail counter). */
  anyWrong: boolean;
  /** True when every slot is now locked. */
  complete: boolean;
}

/**
 * Grade the current placements: a tile is correct when it sits in its home slot
 * (slotId === tileId). Correct tiles lock; wrong tiles are cleared back to the bank.
 * Already-locked slots and empty slots are left untouched.
 */
export function checkPlacements(
  tiles: readonly Tile[],
  assignments: Record<string, string | null>,
  locked: Record<string, boolean>,
): CheckPlacementsResult {
  const nextAssignments = { ...assignments };
  const nextLocked = { ...locked };
  let anyWrong = false;
  tiles.forEach((tile) => {
    if (nextLocked[tile.id]) return;
    const placedTileId = nextAssignments[tile.id];
    if (placedTileId === null || placedTileId === undefined) return;
    if (placedTileId === tile.id) {
      nextLocked[tile.id] = true;
    } else {
      nextAssignments[tile.id] = null;
      anyWrong = true;
    }
  });
  const complete = Object.values(nextLocked).every(Boolean);
  return { assignments: nextAssignments, locked: nextLocked, anyWrong, complete };
}

/** Reveal every answer: place each tile in its home slot and lock them all. */
export function fillPlacements(tiles: readonly Tile[]): {
  assignments: Record<string, string>;
  locked: Record<string, boolean>;
} {
  return {
    assignments: Object.fromEntries(tiles.map((tile) => [tile.id, tile.id])),
    locked: Object.fromEntries(tiles.map((tile) => [tile.id, true])),
  };
}
