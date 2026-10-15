/**
 * FlashcardsExercise.tsx — engine #13 (Phase C, spec 2026-07-03 §4). A self-assessed
 * vocab deck: the learner reads one side of a card, flips it, and rates their own
 * recall (Again / Good). Own scoring model like memory-match — NO Check/Show-answers
 * footer; the rating IS the interaction.
 *
 * This file is a thin view over the pure session model in `flashcards-deck.ts`
 * (buildDeck + deckReducer, unit-tested there). The in-session pass is in-memory:
 * "Again" requeues the card so it resurfaces this session, "Good" retires it, and the
 * deck is done when every card is Good.
 *
 * SRS layer (Step 2, design §4.2) — active only when `options.srs` is set. On top of
 * the in-memory pass it adds cross-session Leitner memory: `srs-scheduler.ts` (pure)
 * tracks each card's box + due-step, `flashcards-storage.ts` persists it to
 * localStorage (guarded — untrusted reads, no-window safe, fresh-deck fallback). On
 * load the deck is ordered by due (struggled cards first — this supersedes `shuffle`
 * for the starting order); rating a card persists its box move ("Again" → box 1 so it
 * leads next time, "Good" → promote so it fades). Reset keeps the store; Clear saved progress empties it.
 *
 * Direction: the learner flips the whole deck between Spanish→English (default,
 * recognition-first) and English→Spanish, unless `options.lockDirection` hides the
 * toggle. `target`/`native` are named by role, so the toggle just swaps which role
 * faces front. The audio speaker and `lang={TARGET_LANG}` always follow the `target`
 * (Spanish) side, wherever it currently renders.
 *
 * A11y: flipping is a transparent full-card <button> (`flashcards-flip-hit`) layered
 * under the faces; rating/toggle/restart are real <button>s; the inline audio speaker
 * is a real <button> living inside the target face. None nest inside another button
 * (a button-in-button is invalid HTML) — the faces are non-interactive, and CSS
 * pointer-events routing lets card clicks fall through to the flip-hit while the
 * speaker keeps its own. Only target-language content is wrapped in
 * `lang={TARGET_LANG}`; all chrome stays `en`.
 *
 * Spec: docs/specs/2026-07-03-new-exercise-engines-design.md §4.
 */
import { useReducer, useState, type CSSProperties } from 'react';
import { Frown, RotateCcw, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AudioClip } from '@/components/audio/AudioClip';
import { resolveAsset, resolveHomeHref } from '@/lib/assets';
import { TARGET_LANG } from '@/lib/lang';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import {
  FlashcardsExerciseConfigSchema,
  FlashcardsOptionsSchema,
  type FlashcardDirection,
} from './flashcards-schema';
import {
  buildDeck,
  cardId,
  deckReducer,
  initDeckState,
  type DeckCard,
  type DeckGrade,
} from './flashcards-deck';
import { initSrsState, gradeCard, dueOrder, type SrsGrade, type SrsState } from './srs-scheduler';
import { storageKey, loadSrsState, saveSrsState, clearSrsState } from './flashcards-storage';
import { RateButtons } from './RateButtons';
import { ClearProgress } from './ClearProgress';
import { EXERCISE_BUTTONS } from '@/exercises/lib/exercise-buttons';
import { FlipCue } from '@/exercises/lib/FlipCue';
import { resolveLabel } from '@/config/ui-strings';
import './flashcards.css';

/** The learner's own language; the deck's `native` side. */
const NATIVE_LANG = 'en';
const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });
/** Face and direction labels, e.g. "Spanish" / "English", from the language code. */
const TARGET_NAME = languageNames.of(TARGET_LANG) ?? TARGET_LANG;
const NATIVE_NAME = languageNames.of(NATIVE_LANG) ?? NATIVE_LANG;

/**
 * Reorder a freshly-built deck so the most-due cards lead (SRS load-order). A fresh
 * scheduler has every card due 0, so this is a stable no-op on a first visit and only
 * bites once boxes diverge across sessions. Pure wiring over the scheduler's `dueOrder`.
 */
function orderByDue(cards: readonly DeckCard[], srs: SrsState): DeckCard[] {
  const byId = new Map(cards.map((card) => [card.id, card]));
  return dueOrder(
    srs,
    cards.map((card) => card.id),
  )
    .map((id) => byId.get(id))
    .filter((card): card is DeckCard => card !== undefined);
}

export default function FlashcardsExercise({ config, progressId }: ExerciseComponentProps) {
  const parsed = FlashcardsExerciseConfigSchema.safeParse(config);

  // Hooks must run unconditionally — build a safe initial deck even when the config
  // is invalid (the error UI returns before any of this state is read).
  const options = parsed.success ? FlashcardsOptionsSchema.parse(parsed.data.options ?? {}) : null;
  const content = parsed.success ? parsed.data.content : null;

  // SRS wiring (design §4.2), engaged only when the author opts in. Card ids are the
  // target words (`cardId`, as buildDeck assigns them), so they derive straight from
  // the content — no need to build the deck to seed the scheduler. Progress is saved
  // only when the host says where the deck lives (`progressId`, E13a); without one the
  // scheduler still orders this visit's deck, in memory.
  const srsEnabled = Boolean(options?.srs) && content !== null;
  const cardIds = content ? content.cards.map((card) => cardId(card.target)) : [];
  const storeKey = srsEnabled && progressId ? storageKey(resolveHomeHref(), progressId) : null;

  const [srs, setSrs] = useState<SrsState>(() =>
    storeKey ? loadSrsState(storeKey, cardIds) : initSrsState(cardIds),
  );

  const [state, dispatch] = useReducer(
    deckReducer,
    { content, shuffle: options?.shuffle ?? false, srsEnabled, srs },
    (init) => {
      const base = init.content ? buildDeck(init.content, init.shuffle) : [];
      return initDeckState(init.srsEnabled ? orderByDue(base, init.srs) : base);
    },
  );

  const [direction, setDirection] = useState<FlashcardDirection>(
    options?.direction ?? 'target-native',
  );

  if (!parsed.success || !content || !options) {
    return (
      <p className="text-sm text-destructive">
        Invalid <code>flashcards</code> config:{' '}
        {parsed.success ? 'no content' : (parsed.error.issues[0]?.message ?? 'parse error')}
      </p>
    );
  }

  const current = state.queue[0];

  // Rebuild the deck for another pass. SRS progress persists, so the fresh deck is
  // re-ordered by the current due-state (struggled cards lead again).
  const freshQueue = (nextSrs: SrsState) => {
    const base = buildDeck(content, options.shuffle);
    return srsEnabled ? orderByDue(base, nextSrs) : base;
  };

  // Rating a card runs the in-memory pass (requeue-on-again / retire-on-good) and, when
  // SRS is on, persists the card's Leitner box move for the next session.
  const handleRate = (grade: SrsGrade) => {
    if (srsEnabled && current) {
      const nextSrs = gradeCard(srs, current.id, grade);
      setSrs(nextSrs);
      if (storeKey) saveSrsState(storeKey, nextSrs);
    }
    dispatch({ kind: 'rate', grade });
  };

  // Reset starts the round again and keeps the saved memory, so struggled cards still
  // lead (maintainer, 2026-10-12). Forgetting it is ClearProgress, a separate button.
  const handleReset = () => dispatch({ kind: 'restart', queue: freshQueue(srs) });

  // Clear saved progress: forget the stored schedule and start a fresh deck from box 1.
  const handleClearProgress = () => {
    if (storeKey) clearSrsState(storeKey);
    const fresh = initSrsState(cardIds);
    setSrs(fresh);
    dispatch({ kind: 'restart', queue: freshQueue(fresh) });
  };

  const { queue, flipped, known, total, order, results } = state;
  const recognised = order.filter((id) => results[id] === 'good').length;
  const progress = <ProgressDots order={order} results={results} currentId={current?.id ?? null} />;

  const housekeeping = (
    <div className="flashcards-footer">
      {/* The same Reset as every other exercise (maintainer, 2026-10-12). */}
      <Button {...EXERCISE_BUTTONS.reset} onClick={handleReset}>
        <RotateCcw aria-hidden="true" />
        {resolveLabel('reset')}
      </Button>
      {storeKey ? <ClearProgress onClear={handleClearProgress} /> : null}
    </div>
  );

  if (!current) {
    return (
      <div className="flashcards">
        <div className="flashcards-toolbar">{progress}</div>
        <p className="flashcards-status" role="status" aria-live="polite">
          Deck complete — {total} {total === 1 ? 'card' : 'cards'} learned.
        </p>
        {housekeeping}
      </div>
    );
  }

  const targetOnFront = direction === 'target-native';
  const frontText = targetOnFront ? current.target : current.native;
  const backText = targetOnFront ? current.native : current.target;
  const faceLang = (isTarget: boolean) => (isTarget ? TARGET_LANG : undefined);
  const langName = (isTarget: boolean) => (isTarget ? TARGET_NAME : NATIVE_NAME);
  // The cards still waiting behind this one, capped at the two drawn (flashcards.css).
  const stack = Math.min(queue.length - 1, 2);

  const speaker = (isTarget: boolean) =>
    isTarget && current.audio ? (
      <AudioClip
        className="super-compact-speaker flashcards-audio"
        soundFile={current.audio}
        size={56}
        inline
      />
    ) : null;

  return (
    <div className="flashcards">
      <p className="sr-only" role="status" aria-live="polite">
        {`Card ${known + 1} of ${total}. ${recognised} recognised.`}
      </p>

      <div className="flashcards-toolbar">
        {progress}
        {options.lockDirection ? null : (
          <div className="flashcards-direction" role="group" aria-label="Card direction">
            <button
              type="button"
              aria-pressed={targetOnFront}
              onClick={() => setDirection('target-native')}
            >
              {`${TARGET_NAME} to ${NATIVE_NAME}`}
            </button>
            <button
              type="button"
              aria-pressed={!targetOnFront}
              onClick={() => setDirection('native-target')}
            >
              {`${NATIVE_NAME} to ${TARGET_NAME}`}
            </button>
          </div>
        )}
      </div>

      <div className="flashcards-card-wrap" data-stack={stack}>
        <div className="flashcards-card" data-flipped={flipped}>
          <span className="flashcards-card-inner">
            <span
              className="flashcards-face flashcards-face-front"
              aria-hidden={flipped}
              inert={flipped}
            >
              <span className="flashcards-lang">{langName(targetOnFront)}</span>
              <span className="flashcards-term" lang={faceLang(targetOnFront)}>
                {frontText}
              </span>
              {speaker(targetOnFront)}
              <FlipCue />
            </span>
            <span
              className="flashcards-face flashcards-face-back"
              aria-hidden={!flipped}
              inert={!flipped}
            >
              <span className="flashcards-lang">{langName(!targetOnFront)}</span>
              {/* The prompt stays, small, so the learner can compare the two sides. */}
              <span className="flashcards-prompt" lang={faceLang(targetOnFront)}>
                {frontText}
              </span>
              <span className="flashcards-term" lang={faceLang(!targetOnFront)}>
                {backText}
              </span>
              {speaker(!targetOnFront)}
              {current.image ? (
                <img className="flashcards-image" src={resolveAsset(current.image)} alt="" />
              ) : null}
            </span>
          </span>

          <button
            type="button"
            className="flashcards-flip-hit"
            data-flipped={flipped}
            aria-pressed={flipped}
            aria-label={flipped ? 'Card back, click to flip to front' : 'Card front, click to flip'}
            onClick={() => dispatch({ kind: 'flip' })}
          />
        </div>
      </div>

      {/* The card is the flip control, so there is no Show answer button (maintainer,
          2026-10-12). The rating row is always laid out and hidden until the flip
          (flashcards.css), so nothing below it jumps. */}
      <div className="flashcards-actions" data-flipped={flipped}>
        <RateButtons onRate={handleRate} />
      </div>

      {content.footnote ? (
        <p className="flashcards-footnote" lang={TARGET_LANG}>
          {content.footnote}
        </p>
      ) : null}

      {housekeeping}
    </div>
  );
}

interface ProgressDotsProps {
  order: readonly string[];
  results: Readonly<Record<string, DeckGrade>>;
  currentId: string | null;
}

/**
 * One circle per card, in the order the session started: empty until rated, then a
 * happy face (Got it) or a sad face (Again), the latest rating winning. Decorative —
 * the sr-only status line above says the same in words. When every card is Got it,
 * the row hops once.
 */
export function ProgressDots({ order, results, currentId }: ProgressDotsProps) {
  // Every card Got it: the row hops, as the progress meter does (flashcards.css).
  const isComplete = order.length > 0 && order.every((id) => results[id] === 'good');
  return (
    <ol
      className="flashcards-dots"
      aria-hidden="true"
      data-complete={isComplete ? 'true' : undefined}
    >
      {order.map((id, index) => {
        // Own keys only: a card id can be a built-in name such as "constructor".
        const result = Object.hasOwn(results, id) ? results[id] : 'pending';
        return (
          <li
            key={id}
            className="flashcards-dot"
            data-result={result}
            data-current={id === currentId ? 'true' : undefined}
            style={{ '--slot-index': index } as CSSProperties}
          >
            {result === 'good' ? <Smile /> : result === 'again' ? <Frown /> : null}
          </li>
        );
      })}
    </ol>
  );
}
