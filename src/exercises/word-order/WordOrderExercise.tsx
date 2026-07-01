/**
 * WordOrderExercise.tsx — engine #10 of 12 (spec §2, §7). Sequence/placement family:
 * the learner reorders scrambled word cards into the correct sentence order.
 *
 * Ported from french-lo-1's WordOrderExercise, but the interaction is click-to-select
 * + click-to-swap instead of native HTML5 drag-and-drop. Native `draggable` is
 * mouse-only — no keyboard path and unreliable on touch — so every card is a plain
 * `<button>`: click one to pick it up (aria-pressed), click another to swap, click the
 * same one again to cancel. Keyboard users get the same flow for free (Tab + Enter/
 * Space). The FLIP swap animation is unchanged from the original (reorderAnimation,
 * "ported once" per spec §8).
 *
 * `options.shuffle` is N/A (§5.2): the deck always scrambles, on mount AND on Reset.
 * `allowShowAnswers` applies (§5.3) via the shared `canRevealAnswers` gate.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §5.2, §5.3, §7, §8.
 */
import { useLayoutEffect, useReducer, useRef } from 'react';
import { AudioClip } from '@/components/audio/AudioClip';
import { ExerciseOptionsSchema } from '@/config/lo-schema';
import { resolveLabel } from '@/config/ui-strings';
import { shuffle } from '@/exercises/lib/shuffle';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import { ExerciseFooter } from '../lib/ExerciseFooter';
import { canRevealAnswers } from '../lib/reveal';
import { captureFlipPositions, playFlipAnimation } from '../lib/reorderAnimation';
import { WordOrderExerciseConfigSchema, type WordOrderContent } from './word-order-schema';
import './word-order.css';

const REORDER_DURATION_MS = 260;

interface Token {
  id: string;
  label: string;
}

function buildTokens(words: readonly string[]): Token[] {
  return words.map((label, index) => ({ id: `token-${index}`, label }));
}

/** Shuffle, retrying once if it happens to land back on the original order. */
function scramble(tokens: readonly Token[]): Token[] {
  const scrambled = shuffle(tokens);
  if (tokens.length < 2) return scrambled;
  const unchanged = scrambled.every((token, index) => token.id === tokens[index]?.id);
  if (!unchanged) return scrambled;
  const [first, second, ...rest] = scrambled;
  return first && second ? [second, first, ...rest] : scrambled;
}

function swapById(order: readonly Token[], idA: string, idB: string): Token[] {
  const next = [...order];
  const indexA = next.findIndex((token) => token.id === idA);
  const indexB = next.findIndex((token) => token.id === idB);
  if (indexA < 0 || indexB < 0) return next;
  [next[indexA], next[indexB]] = [next[indexB], next[indexA]];
  return next;
}

interface OrderState {
  expected: Token[];
  order: Token[];
  selectedId: string | null;
  hasReordered: boolean;
  hasChecked: boolean;
  failCount: number;
  complete: boolean;
  usedShowAnswer: boolean;
}

type OrderAction =
  | { kind: 'patch'; patch: Partial<OrderState> }
  | { kind: 'reset'; expected: Token[] };

function freshState(expected: Token[]): OrderState {
  return {
    expected,
    order: scramble(expected),
    selectedId: null,
    hasReordered: false,
    hasChecked: false,
    failCount: 0,
    complete: false,
    usedShowAnswer: false,
  };
}

function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.kind) {
    case 'patch':
      return { ...state, ...action.patch };
    case 'reset':
      return freshState(action.expected);
    default:
      return state;
  }
}

export default function WordOrderExercise({ config }: ExerciseComponentProps) {
  const parsed = WordOrderExerciseConfigSchema.safeParse(config);

  // Hooks must run unconditionally — the error UI returns before any of this is used.
  const options = parsed.success ? ExerciseOptionsSchema.parse(parsed.data.options ?? {}) : null;
  const content: WordOrderContent | null = parsed.success ? parsed.data.content : null;

  const [state, dispatch] = useReducer(orderReducer, content, (initContent) =>
    freshState(initContent ? buildTokens(initContent.words) : []),
  );

  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const pendingFlipRef = useRef<ReturnType<typeof captureFlipPositions> | null>(null);

  // After a swap/reset/show-answers reorder commits, play the FLIP from the
  // captured rects (same pattern as memory-match's show-answers reorder).
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
        Invalid <code>word-order</code> config:{' '}
        {parsed.success ? 'no content' : (parsed.error.issues[0]?.message ?? 'parse error')}
      </p>
    );
  }

  const {
    expected,
    order,
    selectedId,
    hasReordered,
    hasChecked,
    complete,
    usedShowAnswer,
    failCount,
  } = state;
  const total = expected.length;
  const labels = parsed.data.labels;
  const correctCount = order.filter((token, index) => token.id === expected[index]?.id).length;

  const setCardRef = (id: string, element: HTMLButtonElement | null) => {
    if (element) cardRefs.current.set(id, element);
    else cardRefs.current.delete(id);
  };

  const captureBeforeReorder = () =>
    captureFlipPositions(
      order.map((token) => token.id),
      (id) => cardRefs.current.get(id),
    );

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
    pendingFlipRef.current = captureBeforeReorder();
    dispatch({
      kind: 'patch',
      patch: {
        order: swapById(order, selectedId, id),
        selectedId: null,
        hasReordered: true,
        complete: false,
      },
    });
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
    <div className="word-order">
      {content.audio ? (
        <AudioClip className="super-compact-speaker" soundFile={content.audio} inline />
      ) : null}

      <ol className="word-order-row" aria-label="Word order">
        {order.map((token, index) => {
          const isSelected = selectedId === token.id;
          return (
            <li key={token.id}>
              <button
                type="button"
                className="word-order-token"
                data-state={complete ? 'correct' : 'default'}
                aria-pressed={isSelected}
                disabled={complete}
                onClick={() => handleTokenClick(token.id)}
                ref={(element) => setCardRef(token.id, element)}
              >
                <span className="word-order-index" aria-hidden="true">
                  {index + 1}
                </span>
                {token.label}
              </button>
            </li>
          );
        })}
      </ol>

      <p className="word-order-status" role="status" aria-live="polite">
        {complete ? resolveLabel('correct', labels) : `${correctCount} / ${total}`}
      </p>

      {content.footnote ? <p className="word-order-footnote">{content.footnote}</p> : null}

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
