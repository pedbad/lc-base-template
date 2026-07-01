/**
 * PhraseReorderExercise.tsx — engine #11 of 12 (spec §2, §7). Sequence/placement
 * family: the learner reorders scrambled phrase cards into the correct sequence.
 *
 * Ported from french-lo-1's PhraseReorderExercise. Differs from word-order (#10) in
 * shape, not mechanics: each SLOT is a row with a fixed, non-draggable `prompt`/
 * `audio` pair (never moves), and only the `phrase` card slides between slots. The
 * swap/FLIP/reveal machinery is the same pattern as word-order — click-to-select +
 * click-to-swap (keyboard/touch) alongside native HTML5 drag-and-drop (desktop
 * mouse), both driving the same `swapById` commit.
 *
 * `options.shuffle` is N/A (§5.2): the deck always scrambles, on mount AND on Reset.
 * `allowShowAnswers` applies (§5.3) via the shared `canRevealAnswers` gate.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §5.2, §5.3, §7, §8.
 */
import { useLayoutEffect, useReducer, useRef, type DragEvent } from 'react';
import { AudioClip } from '@/components/audio/AudioClip';
import { ExerciseOptionsSchema } from '@/config/lo-schema';
import { resolveLabel } from '@/config/ui-strings';
import { shuffle } from '@/exercises/lib/shuffle';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import { ExerciseFooter } from '../lib/ExerciseFooter';
import { canRevealAnswers } from '../lib/reveal';
import { captureFlipPositions, playFlipAnimation } from '../lib/reorderAnimation';
import { TARGET_LANG } from '@/lib/lang';
import {
  PhraseReorderExerciseConfigSchema,
  type PhraseReorderContent,
} from './phrase-reorder-schema';
import './phrase-reorder.css';

const REORDER_DURATION_MS = 260;

interface PhraseToken {
  id: string;
  phrase: string;
}

function buildTokens(rows: PhraseReorderContent['rows']): PhraseToken[] {
  return rows.map((row, index) => ({ id: `slot-${index}`, phrase: row.phrase }));
}

/** Shuffle, retrying once if it happens to land back on the original order. */
function scramble(tokens: readonly PhraseToken[]): PhraseToken[] {
  const scrambled = shuffle(tokens);
  if (tokens.length < 2) return scrambled;
  const unchanged = scrambled.every((token, index) => token.id === tokens[index]?.id);
  if (!unchanged) return scrambled;
  const [first, second, ...rest] = scrambled;
  return first && second ? [second, first, ...rest] : scrambled;
}

function swapById(order: readonly PhraseToken[], idA: string, idB: string): PhraseToken[] {
  const next = [...order];
  const indexA = next.findIndex((token) => token.id === idA);
  const indexB = next.findIndex((token) => token.id === idB);
  if (indexA < 0 || indexB < 0) return next;
  [next[indexA], next[indexB]] = [next[indexB], next[indexA]];
  return next;
}

interface ReorderState {
  expected: PhraseToken[];
  order: PhraseToken[];
  selectedId: string | null;
  draggingId: string | null;
  dropTargetId: string | null;
  hasReordered: boolean;
  hasChecked: boolean;
  failCount: number;
  complete: boolean;
  usedShowAnswer: boolean;
}

type ReorderAction =
  | { kind: 'patch'; patch: Partial<ReorderState> }
  | { kind: 'reset'; expected: PhraseToken[] };

function freshState(expected: PhraseToken[]): ReorderState {
  return {
    expected,
    order: scramble(expected),
    selectedId: null,
    draggingId: null,
    dropTargetId: null,
    hasReordered: false,
    hasChecked: false,
    failCount: 0,
    complete: false,
    usedShowAnswer: false,
  };
}

function reorderReducer(state: ReorderState, action: ReorderAction): ReorderState {
  switch (action.kind) {
    case 'patch':
      return { ...state, ...action.patch };
    case 'reset':
      return freshState(action.expected);
    default:
      return state;
  }
}

export default function PhraseReorderExercise({ config }: ExerciseComponentProps) {
  const parsed = PhraseReorderExerciseConfigSchema.safeParse(config);

  // Hooks must run unconditionally — the error UI returns before any of this is used.
  const options = parsed.success ? ExerciseOptionsSchema.parse(parsed.data.options ?? {}) : null;
  const content: PhraseReorderContent | null = parsed.success ? parsed.data.content : null;

  const [state, dispatch] = useReducer(reorderReducer, content, (initContent) =>
    freshState(initContent ? buildTokens(initContent.rows) : []),
  );

  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const pendingFlipRef = useRef<ReturnType<typeof captureFlipPositions> | null>(null);

  // After a swap/reset/show-answers reorder commits, play the FLIP from the
  // captured rects (same pattern as word-order).
  useLayoutEffect(() => {
    if (!pendingFlipRef.current) return;
    const before = pendingFlipRef.current;
    pendingFlipRef.current = null;
    playFlipAnimation({
      before,
      ids: state.order.map((token) => token.id),
      getElement: (id) => cardRefs.current.get(id),
      duration: REORDER_DURATION_MS,
    });
  }, [state.order]);

  if (!parsed.success || !content || !options) {
    return (
      <p className="text-sm text-destructive">
        Invalid <code>phrase-reorder</code> config:{' '}
        {parsed.success ? 'no content' : (parsed.error.issues[0]?.message ?? 'parse error')}
      </p>
    );
  }

  const {
    expected,
    order,
    selectedId,
    draggingId,
    dropTargetId,
    hasReordered,
    hasChecked,
    complete,
    usedShowAnswer,
    failCount,
  } = state;
  const total = expected.length;
  const labels = parsed.data.labels;
  const correctCount = order.filter((token, index) => token.id === expected[index]?.id).length;
  const showPromptColumn = content.rows.some((row) => row.prompt);

  const setCardRef = (id: string, element: HTMLButtonElement | null) => {
    if (element) cardRefs.current.set(id, element);
    else cardRefs.current.delete(id);
  };

  const captureBeforeReorder = () =>
    captureFlipPositions(
      order.map((token) => token.id),
      (id) => cardRefs.current.get(id),
    );

  const swapAndCommit = (idA: string, idB: string) => {
    pendingFlipRef.current = captureBeforeReorder();
    dispatch({
      kind: 'patch',
      patch: {
        order: swapById(order, idA, idB),
        selectedId: null,
        draggingId: null,
        dropTargetId: null,
        hasReordered: true,
        complete: false,
      },
    });
  };

  const handleTokenClick = (id: string) => {
    if (complete) return;
    if (selectedId === null) {
      dispatch({ kind: 'patch', patch: { selectedId: id } });
      return;
    }
    if (selectedId === id) {
      dispatch({ kind: 'patch', patch: { selectedId: null } });
      return;
    }
    swapAndCommit(selectedId, id);
  };

  // Native drag-and-drop — a mouse-only progressive enhancement over the click
  // path above (desktop/large screens). Keep drag semantics as "move" so the OS
  // doesn't show a copy (+) cursor.
  const handleDragStart = (event: DragEvent<HTMLButtonElement>, id: string) => {
    if (complete) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
    dispatch({ kind: 'patch', patch: { draggingId: id, selectedId: null } });
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (id: string) => {
    if (draggingId && draggingId !== id) dispatch({ kind: 'patch', patch: { dropTargetId: id } });
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>, targetId: string) => {
    event.preventDefault();
    if (!draggingId || draggingId === targetId) {
      dispatch({ kind: 'patch', patch: { draggingId: null, dropTargetId: null } });
      return;
    }
    swapAndCommit(draggingId, targetId);
  };

  const handleDragEnd = () => {
    dispatch({ kind: 'patch', patch: { draggingId: null, dropTargetId: null } });
  };

  const handleCheck = () => {
    const isComplete = correctCount === total;
    dispatch({
      kind: 'patch',
      patch: {
        hasChecked: true,
        complete: isComplete,
        failCount: isComplete ? failCount : failCount + 1,
        selectedId: null,
      },
    });
  };

  const handleReset = () => dispatch({ kind: 'reset', expected });

  const handleShowAnswers = () => {
    pendingFlipRef.current = captureBeforeReorder();
    dispatch({
      kind: 'patch',
      patch: {
        order: [...expected],
        selectedId: null,
        draggingId: null,
        dropTargetId: null,
        hasReordered: true,
        hasChecked: true,
        complete: true,
        usedShowAnswer: true,
      },
    });
  };

  const canReveal = canRevealAnswers({
    allowShowAnswers: options.allowShowAnswers,
    hasAttempted: hasChecked,
    total,
    nCorrect: correctCount,
  });
  const showReset = hasReordered || hasChecked || usedShowAnswer;

  return (
    <div className="phrase-reorder">
      <ol className="phrase-reorder-rows" aria-label="Phrase order">
        {content.rows.map((row, index) => {
          const token = order[index];
          if (!token) return null;
          const isSelected = selectedId === token.id;
          const isDragging = draggingId === token.id;
          const isDropTarget = dropTargetId === token.id && !isDragging;
          return (
            <li
              key={`slot-${index}`}
              className="phrase-reorder-row"
              data-has-prompt={showPromptColumn}
            >
              <div className="phrase-reorder-audio">
                {row.audio ? (
                  <AudioClip className="super-compact-speaker" soundFile={row.audio} inline />
                ) : null}
              </div>

              {showPromptColumn ? <div className="phrase-reorder-prompt">{row.prompt}</div> : null}

              <button
                type="button"
                className="phrase-reorder-token"
                data-state={complete ? 'correct' : 'default'}
                data-dragging={isDragging}
                data-drop-target={isDropTarget}
                aria-pressed={isSelected}
                lang={TARGET_LANG}
                disabled={complete}
                draggable={!complete}
                onClick={() => handleTokenClick(token.id)}
                onDragStart={(event) => handleDragStart(event, token.id)}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(token.id)}
                onDrop={(event) => handleDrop(event, token.id)}
                onDragEnd={handleDragEnd}
                ref={(element) => setCardRef(token.id, element)}
              >
                <span className="phrase-reorder-index" aria-hidden="true">
                  {index + 1}
                </span>
                {token.phrase}
              </button>
            </li>
          );
        })}
      </ol>

      <p className="phrase-reorder-status" role="status" aria-live="polite">
        {complete ? resolveLabel('correct', labels) : `${correctCount} / ${total}`}
      </p>

      {content.footnote ? (
        <p className="phrase-reorder-footnote" lang={TARGET_LANG}>
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
