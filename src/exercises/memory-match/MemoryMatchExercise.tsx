/**
 * MemoryMatchExercise.tsx — engine #9 of 12 (spec §2, §7). A pairs game: the learner
 * flips cards to pair each picture with its word. Own scoring model (spec §7): no
 * Check button — pairs and tries are tracked live; the §5.3 reveal (Show-answers)
 * reorders the deck into solved pairs and flips them all face-up.
 *
 * Ported from french-lo-1's MemoryMatchGame, adapted to the template: pairs are linked
 * by a stable `pairId` (not by matching content strings), french-lo-1's bespoke design
 * tokens are mapped to the template palette, and the 3D card styling lives in
 * memory-match.css instead of inline Tailwind. The show-answers reorder is animated
 * with the shared FLIP helper (reorderAnimation). `options.sampleSize` plays a random
 * N of M pairs; the deck is always shuffled (shuffle is N/A — spec §5.2).
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §2, §5.2, §5.3, §7, §8.
 */
import { useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import { Button } from '@/components/ui/button';
import AudioManager from '@/audio/AudioManager';
import { resolveAsset } from '@/lib/assets';
import { ExerciseOptionsSchema } from '@/config/lo-schema';
import { resolveLabel } from '@/config/ui-strings';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import { canRevealAnswers } from '../lib/reveal';
import { captureFlipPositions, playFlipAnimation } from '../lib/reorderAnimation';
import { MemoryCard, type DeckCard } from './MemoryCard';
import { MemoryMatchExerciseConfigSchema, type MemoryMatchContent } from './memory-match-schema';
import './memory-match.css';

const FLIP_DURATION_MS = 800;
const REVEAL_PAUSE_MS = 450;
const CARD_TRANSITION_MS = FLIP_DURATION_MS + REVEAL_PAUSE_MS;
const REORDER_DURATION_MS = 620;
const REORDER_STAGGER_MS = 18;

/** Fisher-Yates, immutable (returns a new array; never mutates the input). */
function shuffle<T>(input: readonly T[]): T[] {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Expand the pairs into a shuffled deck: one image card + one text card per pair. */
function buildDeck(content: MemoryMatchContent, sampleSize?: number): DeckCard[] {
  const chosen = shuffle(content.items).slice(0, sampleSize ?? content.items.length);
  const cards: DeckCard[] = [];
  chosen.forEach((item, index) => {
    const pairId = String(index);
    cards.push({
      id: `${index}-img`,
      pairId,
      kind: 'image',
      image: item.image,
      alt: item.alt ?? item.localLanguage ?? '',
    });
    cards.push({
      id: `${index}-txt`,
      pairId,
      kind: 'text',
      text: item.text,
      audio: item.audio,
      alt: item.text,
    });
  });
  return shuffle(cards);
}

/** Reorder the current deck so matched pairs sit adjacent (image then text). */
function solveOrder(cards: readonly DeckCard[]): DeckCard[] {
  const byPair = new Map<string, { image?: DeckCard; text?: DeckCard }>();
  cards.forEach((card) => {
    const entry = byPair.get(card.pairId) ?? {};
    if (card.kind === 'image') entry.image = card;
    else entry.text = card;
    byPair.set(card.pairId, entry);
  });
  return [...byPair.entries()]
    .sort(([a], [b]) => Number(a) - Number(b))
    .flatMap(([, pair]) => [pair.image, pair.text])
    .filter((card): card is DeckCard => Boolean(card));
}

interface GameState {
  cards: DeckCard[];
  flipped: string[];
  matched: string[];
  nPairs: number;
  nTries: number;
}

type GameAction =
  | { kind: 'patch'; patch: Partial<GameState> }
  | { kind: 'reset'; cards: DeckCard[] };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.kind) {
    case 'patch':
      return { ...state, ...action.patch };
    case 'reset':
      return { cards: action.cards, flipped: [], matched: [], nPairs: 0, nTries: 0 };
    default:
      return state;
  }
}

export default function MemoryMatchExercise({ config }: ExerciseComponentProps) {
  const parsed = MemoryMatchExerciseConfigSchema.safeParse(config);

  // Hooks must run unconditionally — pass a safe deck initialiser even when the
  // config is invalid (the error UI returns before any of it is used).
  const options = parsed.success ? ExerciseOptionsSchema.parse(parsed.data.options ?? {}) : null;
  const content = parsed.success ? parsed.data.content : null;

  const [state, dispatch] = useReducer(
    gameReducer,
    { content, sampleSize: options?.sampleSize },
    (init): GameState => ({
      cards: init.content ? buildDeck(init.content, init.sampleSize) : [],
      flipped: [],
      matched: [],
      nPairs: 0,
      nTries: 0,
    }),
  );

  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const mountedRef = useRef(true);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pendingFlipRef = useRef<ReturnType<typeof captureFlipPositions> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    const timers = timersRef;
    return () => {
      mountedRef.current = false;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  // After the show-answers reorder commits, play the FLIP from the captured rects.
  useLayoutEffect(() => {
    if (!pendingFlipRef.current) return;
    const before = pendingFlipRef.current;
    pendingFlipRef.current = null;
    playFlipAnimation({
      before,
      ids: state.cards.map((card) => card.id),
      getElement: (id) => cardRefs.current.get(id),
      duration: REORDER_DURATION_MS,
      stagger: REORDER_STAGGER_MS,
    });
  }, [state.cards]);

  if (!parsed.success || !content || !options) {
    return (
      <p className="text-sm text-destructive">
        Invalid <code>memory-match</code> config:{' '}
        {parsed.success ? 'no content' : (parsed.error.issues[0]?.message ?? 'parse error')}
      </p>
    );
  }

  const { cards, flipped, matched, nPairs, nTries } = state;
  const total = cards.length / 2;
  const labels = parsed.data.labels;
  const complete = nPairs === total && total > 0;

  const setCardRef = (id: string, element: HTMLButtonElement | null) => {
    if (element) cardRefs.current.set(id, element);
    else cardRefs.current.delete(id);
  };

  const handleFlip = (card: DeckCard) => {
    if (flipped.length === 2 || flipped.includes(card.id) || matched.includes(card.id)) return;

    const newFlipped = [...flipped, card.id];
    dispatch({ kind: 'patch', patch: { flipped: newFlipped } });
    if (newFlipped.length !== 2) return;

    const nextTries = nTries + 1;
    const [firstId, secondId] = newFlipped;
    const first = cards.find((c) => c.id === firstId);
    const second = cards.find((c) => c.id === secondId);

    if (first && second && first.pairId === second.pairId) {
      const soundFile = first.audio ?? second.audio;
      if (soundFile) AudioManager.play(resolveAsset(soundFile));
      dispatch({
        kind: 'patch',
        patch: { matched: [...matched, firstId, secondId], nPairs: nPairs + 1, nTries: nextTries },
      });
    }

    timersRef.current.push(
      setTimeout(() => {
        if (mountedRef.current)
          dispatch({ kind: 'patch', patch: { flipped: [], nTries: nextTries } });
      }, CARD_TRANSITION_MS),
    );
  };

  const handleReset = () => {
    AudioManager.stopAll();
    dispatch({ kind: 'reset', cards: buildDeck(content, options.sampleSize) });
  };

  const handleShowAnswers = () => {
    const before = captureFlipPositions(
      cards.map((card) => card.id),
      (id) => cardRefs.current.get(id),
    );
    const solved = solveOrder(cards);
    pendingFlipRef.current = before;
    dispatch({
      kind: 'patch',
      patch: {
        cards: solved,
        flipped: [],
        matched: solved.map((card) => card.id),
        nPairs: solved.length / 2,
      },
    });
  };

  const canReveal = canRevealAnswers({
    allowShowAnswers: options.allowShowAnswers,
    hasAttempted: nTries > 0,
    total,
    nCorrect: nPairs,
  });

  return (
    <div className="memory-match">
      <ul className="memory-match-deck" aria-label="Memory match cards">
        {cards.map((card) => (
          <li key={card.id}>
            <MemoryCard
              card={card}
              isRevealed={flipped.includes(card.id)}
              isMatched={matched.includes(card.id)}
              disabled={
                complete ||
                (flipped.length === 2 && !flipped.includes(card.id) && !matched.includes(card.id))
              }
              onFlip={handleFlip}
              setRef={setCardRef}
            />
          </li>
        ))}
      </ul>

      <p className="memory-match-status" role="status" aria-live="polite">
        {complete ? resolveLabel('correct', labels) : `${nPairs} / ${total} · ${nTries}`}
      </p>

      {content.footnote ? <p className="memory-match-footnote">{content.footnote}</p> : null}

      <div className="memory-match-footer">
        {nTries > 0 ? (
          <Button variant="outline" onClick={handleReset}>
            {resolveLabel('reset', labels)}
          </Button>
        ) : null}
        {canReveal ? (
          <Button variant="ghost" onClick={handleShowAnswers}>
            {resolveLabel('showAnswer', labels)}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
