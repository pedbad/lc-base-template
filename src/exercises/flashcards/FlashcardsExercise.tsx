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
 * leads next time, "Good" → promote so it fades). "Reset progress" clears the store.
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
import { useReducer, useState } from 'react';
import { Check, Frown, RotateCcw, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AudioClip } from '@/components/audio/AudioClip';
import { resolveAsset } from '@/lib/assets';
import { TARGET_LANG } from '@/lib/lang';
import type { ExerciseComponentProps } from '@/exercises/lazyRegistry';
import {
  FlashcardsExerciseConfigSchema,
  FlashcardsOptionsSchema,
  type FlashcardDirection,
} from './flashcards-schema';
import {
  buildDeck,
  deckReducer,
  initDeckState,
  type DeckCard,
  type DeckGrade,
} from './flashcards-deck';
import { initSrsState, gradeCard, dueOrder, type SrsGrade, type SrsState } from './srs-scheduler';
import { storageKey, loadSrsState, saveSrsState, clearSrsState } from './flashcards-storage';
import { EXERCISE_BUTTONS } from '@/exercises/lib/exercise-buttons';
import './flashcards.css';

/** The learner's own language; the deck's `native` side. */
const NATIVE_LANG = 'en';
const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });
/** Face labels, e.g. "Spanish" / "English", from the course's language code. */
const TARGET_NAME = languageNames.of(TARGET_LANG) ?? TARGET_LANG;
const NATIVE_NAME = languageNames.of(NATIVE_LANG) ?? NATIVE_LANG;
/** Direction-switch labels, e.g. "ES → EN". */
const TARGET_CODE = TARGET_LANG.toUpperCase();
const NATIVE_CODE = NATIVE_LANG.toUpperCase();

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

export default function FlashcardsExercise({ config }: ExerciseComponentProps) {
  const parsed = FlashcardsExerciseConfigSchema.safeParse(config);

  // Hooks must run unconditionally — build a safe initial deck even when the config
  // is invalid (the error UI returns before any of this state is read).
  const options = parsed.success ? FlashcardsOptionsSchema.parse(parsed.data.options ?? {}) : null;
  const content = parsed.success ? parsed.data.content : null;

  // SRS wiring (design §4.2), engaged only when the author opts in. Card ids are
  // `String(index)` from buildDeck and are shuffle-independent, so they derive
  // straight from the content — no need to build the deck to seed the scheduler.
  const srsEnabled = Boolean(options?.srs) && content !== null;
  const cardIds = content ? content.cards.map((_, index) => String(index)) : [];
  const storeKey = srsEnabled && content ? storageKey(content) : '';

  const [srs, setSrs] = useState<SrsState>(() =>
    srsEnabled ? loadSrsState(storeKey, cardIds) : initSrsState(cardIds),
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
  const handleRestart = () => dispatch({ kind: 'restart', queue: freshQueue(srs) });

  // Rating a card runs the in-memory pass (requeue-on-again / retire-on-good) and, when
  // SRS is on, persists the card's Leitner box move for the next session.
  const handleRate = (grade: SrsGrade) => {
    if (srsEnabled && current) {
      const nextSrs = gradeCard(srs, current.id, grade);
      setSrs(nextSrs);
      saveSrsState(storeKey, nextSrs);
    }
    dispatch({ kind: 'rate', grade });
  };

  // "Reset progress": wipe persisted boxes and start a fresh deck from box 1.
  const handleResetProgress = () => {
    clearSrsState(storeKey);
    const fresh = initSrsState(cardIds);
    setSrs(fresh);
    dispatch({ kind: 'restart', queue: freshQueue(fresh) });
  };

  const { queue, flipped, known, total, order, results } = state;
  const recognised = order.filter((id) => results[id] === 'good').length;
  const progress = <ProgressDots order={order} results={results} currentId={current?.id ?? null} />;

  const housekeeping = (
    <div className="flashcards-footer">
      <Button variant="ghost" size="sm" onClick={handleRestart}>
        <RotateCcw aria-hidden="true" />
        Restart
      </Button>
      {srsEnabled ? (
        <Button variant="ghost" size="sm" onClick={handleResetProgress}>
          Reset progress
        </Button>
      ) : null}
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
        size={28}
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
              {`${TARGET_CODE} → ${NATIVE_CODE}`}
            </button>
            <button
              type="button"
              aria-pressed={!targetOnFront}
              onClick={() => setDirection('native-target')}
            >
              {`${NATIVE_CODE} → ${TARGET_CODE}`}
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
              <span className="flashcards-hint" aria-hidden="true">
                Select the card to flip
              </span>
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

      {/* One row, one height in both states, so nothing below it jumps on a flip. */}
      <div className="flashcards-actions" data-flipped={flipped}>
        {flipped ? (
          <>
            <Button variant="outline" size="lg" onClick={() => handleRate('again')}>
              <RotateCcw aria-hidden="true" />
              Again
            </Button>
            <Button
              size="lg"
              className={EXERCISE_BUTTONS.check.className}
              onClick={() => handleRate('good')}
            >
              <Check aria-hidden="true" />
              Got it
            </Button>
          </>
        ) : (
          <Button size="lg" onClick={() => dispatch({ kind: 'flip' })}>
            Show answer
          </Button>
        )}
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
 * the sr-only status line above says the same in words.
 */
function ProgressDots({ order, results, currentId }: ProgressDotsProps) {
  return (
    <ol className="flashcards-dots" aria-hidden="true">
      {order.map((id) => {
        const result = results[id] ?? 'pending';
        return (
          <li
            key={id}
            className="flashcards-dot"
            data-result={result}
            data-current={id === currentId ? 'true' : undefined}
          >
            {result === 'good' ? <Smile /> : result === 'again' ? <Frown /> : null}
          </li>
        );
      })}
    </ol>
  );
}
