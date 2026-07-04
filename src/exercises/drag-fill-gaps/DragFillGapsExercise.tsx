/**
 * DragFillGapsExercise.tsx — engine #12 of 12 (spec §2, §7), the last of the
 * sequence-cluster engines. The learner drags word tiles from a shared bank into
 * the `[bracketed]` blanks embedded in one or more sentences.
 *
 * Ported from french-lo-1's DraggableFillGaps (`phrases` variant only — see the
 * schema file for the YAGNI note on the four other legacy table layouts). The
 * original drove absolute-pixel dragging with manual DOM position pinning
 * (`pinTiles`, `inLimits`, pointer math); this port follows the template's
 * established accessible pattern instead (word-order/phrase-reorder): every tile
 * and slot is a real `<button>`, so click-to-select-then-place works via keyboard
 * and touch for free, with native HTML5 drag-and-drop layered on top as a
 * mouse-only progressive enhancement. No FLIP animation here — tiles move BETWEEN
 * two distinct containers (bank ↔ inline slot), not within one reordering list, so
 * the FLIP technique (built for in-place list swaps) does not apply cleanly.
 *
 * Scoring is sequence/placement (§7), but with one twist ported faithfully from the
 * original: Check LOCKS every correctly-placed tile in its slot (it can no longer be
 * moved) and bounces every incorrectly-placed tile back to the bank — so `nCorrect`
 * only ever grows, and repeated Check presses let the learner narrow in on the rest.
 *
 * `options.shuffle` applies to the bank's tile order (§5.2, choice-order family);
 * `allowShowAnswers` applies (§5.3) via the shared `canRevealAnswers` gate.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §5.2, §5.3, §7, §8.
 */
import { useReducer, type DragEvent } from 'react';
import { AudioClip } from '@/components/audio/AudioClip';
import { ExerciseOptionsSchema } from '@/config/lo-schema';
import { resolveLabel } from '@/config/ui-strings';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import { ExerciseFooter } from '../lib/ExerciseFooter';
import { canRevealAnswers } from '../lib/reveal';
import { TARGET_LANG } from '@/lib/lang';
import {
  DragFillGapsExerciseConfigSchema,
  type DragFillGapsContent,
} from './drag-fill-gaps-schema';
import {
  bankOrderFor,
  buildModel,
  checkPlacements,
  fillPlacements,
  type Tile,
} from './drag-fill-gaps-grading';
import './drag-fill-gaps.css';

interface DragState {
  /** slotId -> the tileId currently placed there, or null when empty. */
  assignments: Record<string, string | null>;
  /** slotId -> true once Check has confirmed it and locked it in place. */
  locked: Record<string, boolean>;
  /** Fixed display order for the bank (re-shuffled only on mount/Reset). */
  bankOrder: string[];
  selectedTileId: string | null;
  draggingId: string | null;
  dropTargetSlotId: string | null;
  hasChecked: boolean;
  failCount: number;
  complete: boolean;
  usedShowAnswer: boolean;
}

type DragAction =
  | { kind: 'patch'; patch: Partial<DragState> }
  | { kind: 'reset'; tiles: Tile[]; shuffleBank: boolean };

function freshState(tiles: readonly Tile[], shuffleBank: boolean): DragState {
  return {
    assignments: Object.fromEntries(tiles.map((tile) => [tile.id, null])),
    locked: Object.fromEntries(tiles.map((tile) => [tile.id, false])),
    bankOrder: bankOrderFor(tiles, shuffleBank),
    selectedTileId: null,
    draggingId: null,
    dropTargetSlotId: null,
    hasChecked: false,
    failCount: 0,
    complete: false,
    usedShowAnswer: false,
  };
}

function dragReducer(state: DragState, action: DragAction): DragState {
  switch (action.kind) {
    case 'patch':
      return { ...state, ...action.patch };
    case 'reset':
      return freshState(action.tiles, action.shuffleBank);
    default:
      return state;
  }
}

export default function DragFillGapsExercise({ config }: ExerciseComponentProps) {
  const parsed = DragFillGapsExerciseConfigSchema.safeParse(config);

  // Hooks must run unconditionally — the error UI returns before any of this is used.
  const options = parsed.success ? ExerciseOptionsSchema.parse(parsed.data.options ?? {}) : null;
  const content: DragFillGapsContent | null = parsed.success ? parsed.data.content : null;
  const model = content ? buildModel(content) : null;
  const tiles = model?.tiles ?? [];

  const [state, dispatch] = useReducer(dragReducer, tiles, (initTiles) =>
    freshState(initTiles, options?.shuffle ?? false),
  );

  if (!parsed.success || !content || !options || !model) {
    return (
      <p className="text-sm text-destructive">
        Invalid <code>drag-fill-gaps</code> config:{' '}
        {parsed.success ? 'no content' : (parsed.error.issues[0]?.message ?? 'parse error')}
      </p>
    );
  }

  const { rows } = model;
  const tileById = new Map(tiles.map((tile) => [tile.id, tile]));
  const {
    assignments,
    locked,
    bankOrder,
    selectedTileId,
    draggingId,
    dropTargetSlotId,
    hasChecked,
    complete,
    usedShowAnswer,
    failCount,
  } = state;
  const labels = parsed.data.labels;
  const total = tiles.length;
  const nCorrect = Object.values(locked).filter(Boolean).length;
  const placedTileIds = new Set(
    Object.values(assignments).filter((id): id is string => id !== null),
  );
  const bankTileIds = bankOrder.filter((id) => !placedTileIds.has(id));

  const clearTransient = (): Partial<DragState> => ({
    selectedTileId: null,
    draggingId: null,
    dropTargetSlotId: null,
  });

  const placeTile = (tileId: string, slotId: string) => {
    if (locked[slotId]) return;
    const nextAssignments = { ...assignments };
    // A tile can only occupy one slot — clear any slot it currently holds.
    Object.keys(nextAssignments).forEach((id) => {
      if (nextAssignments[id] === tileId) nextAssignments[id] = null;
    });
    nextAssignments[slotId] = tileId;
    dispatch({
      kind: 'patch',
      patch: { assignments: nextAssignments, complete: false, ...clearTransient() },
    });
  };

  const unassignSlot = (slotId: string) => {
    if (locked[slotId]) return;
    dispatch({
      kind: 'patch',
      patch: { assignments: { ...assignments, [slotId]: null }, ...clearTransient() },
    });
  };

  const handleTileClick = (tileId: string) => {
    dispatch({
      kind: 'patch',
      patch: { selectedTileId: selectedTileId === tileId ? null : tileId },
    });
  };

  const handleSlotClick = (slotId: string) => {
    if (locked[slotId]) return;
    // A selected bank tile always wins: placing it into an occupied slot evicts
    // that slot's current tile back to the bank first (placeTile does this),
    // matching the native-dnd drop behavior below.
    if (selectedTileId) {
      placeTile(selectedTileId, slotId);
      return;
    }
    if (assignments[slotId]) unassignSlot(slotId);
  };

  const handleTileDragStart = (event: DragEvent<HTMLButtonElement>, tileId: string) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', tileId);
    dispatch({ kind: 'patch', patch: { draggingId: tileId, selectedTileId: null } });
  };

  const handleSlotDragOver = (event: DragEvent<HTMLButtonElement>, slotId: string) => {
    if (locked[slotId]) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dropTargetSlotId !== slotId)
      dispatch({ kind: 'patch', patch: { dropTargetSlotId: slotId } });
  };

  const handleSlotDrop = (event: DragEvent<HTMLButtonElement>, slotId: string) => {
    event.preventDefault();
    if (draggingId) placeTile(draggingId, slotId);
    else dispatch({ kind: 'patch', patch: clearTransient() });
  };

  const handleBankDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!draggingId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleBankDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (draggingId)
      unassignSlot(Object.keys(assignments).find((id) => assignments[id] === draggingId) ?? '');
    dispatch({ kind: 'patch', patch: clearTransient() });
  };

  const handleDragEnd = () => dispatch({ kind: 'patch', patch: clearTransient() });

  const handleCheck = () => {
    const {
      assignments: nextAssignments,
      locked: nextLocked,
      anyWrong,
      complete: isComplete,
    } = checkPlacements(tiles, assignments, locked);
    dispatch({
      kind: 'patch',
      patch: {
        assignments: nextAssignments,
        locked: nextLocked,
        hasChecked: true,
        complete: isComplete,
        failCount: anyWrong ? failCount + 1 : failCount,
        ...clearTransient(),
      },
    });
  };

  const handleReset = () => dispatch({ kind: 'reset', tiles, shuffleBank: options.shuffle });

  const handleShowAnswers = () => {
    const { assignments: filledAssignments, locked: filledLocked } = fillPlacements(tiles);
    dispatch({
      kind: 'patch',
      patch: {
        assignments: filledAssignments,
        locked: filledLocked,
        hasChecked: true,
        complete: true,
        usedShowAnswer: true,
        ...clearTransient(),
      },
    });
  };

  const canReveal = canRevealAnswers({
    allowShowAnswers: options.allowShowAnswers,
    hasAttempted: hasChecked,
    total,
    nCorrect,
  });
  const hasPlacedAny = placedTileIds.size > 0 || nCorrect > 0;
  const showReset = hasPlacedAny || hasChecked || usedShowAnswer;

  return (
    <div className="drag-fill-gaps">
      <div
        className="drag-fill-gaps-bank"
        aria-label="Word bank"
        onDragOver={handleBankDragOver}
        onDrop={handleBankDrop}
      >
        {bankTileIds.map((tileId) => {
          const tile = tileById.get(tileId);
          if (!tile) return null;
          return (
            <button
              key={tile.id}
              type="button"
              className="drag-fill-gaps-tile"
              data-selected={selectedTileId === tile.id}
              data-dragging={draggingId === tile.id}
              aria-pressed={selectedTileId === tile.id}
              lang={TARGET_LANG}
              draggable
              onClick={() => handleTileClick(tile.id)}
              onDragStart={(event) => handleTileDragStart(event, tile.id)}
              onDragEnd={handleDragEnd}
            >
              {tile.word}
            </button>
          );
        })}
      </div>

      <ol className="drag-fill-gaps-rows" aria-label="Sentences with blanks">
        {rows.map((row, rowIndex) => (
          <li className="drag-fill-gaps-row" key={`row-${rowIndex}`}>
            {row.audio ? (
              <AudioClip className="super-compact-speaker" soundFile={row.audio} inline />
            ) : null}
            <p className="drag-fill-gaps-line" lang={TARGET_LANG}>
              {row.nodes.map((node) => {
                if (node.type === 'text') return <span key={node.key}>{node.value}</span>;
                const slotId = node.id;
                const placedTileId = assignments[slotId];
                const placedTile = placedTileId ? tileById.get(placedTileId) : undefined;
                const isLocked = locked[slotId];
                return (
                  <button
                    type="button"
                    key={node.key}
                    className="drag-fill-gaps-slot"
                    data-state={isLocked ? 'correct' : 'default'}
                    data-drop-target={dropTargetSlotId === slotId}
                    data-filled={Boolean(placedTile)}
                    disabled={isLocked}
                    onClick={() => handleSlotClick(slotId)}
                    onDragOver={(event) => handleSlotDragOver(event, slotId)}
                    onDrop={(event) => handleSlotDrop(event, slotId)}
                  >
                    {placedTile ? placedTile.word : ' '}
                  </button>
                );
              })}
            </p>
          </li>
        ))}
      </ol>

      <p className="drag-fill-gaps-status" role="status" aria-live="polite">
        {complete ? resolveLabel('correct', labels) : `${nCorrect} / ${total}`}
      </p>

      {content.footnote ? (
        <p className="drag-fill-gaps-footnote" lang={TARGET_LANG}>
          {content.footnote}
        </p>
      ) : null}

      <ExerciseFooter
        onCheck={handleCheck}
        checkDisabled={complete}
        onReset={handleReset}
        showReset={showReset}
        onShowAnswers={handleShowAnswers}
        showAnswers={canReveal}
        labels={labels}
      />
    </div>
  );
}
