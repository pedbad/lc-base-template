/**
 * FlashcardsExercise.tsx — engine #13 (Phase C, spec 2026-07-03 §4). A self-assessed
 * vocab deck: the learner reads one side of a card, flips it, and rates their own
 * recall (Again / Good). Own scoring model like memory-match — NO Check/Show-answers
 * footer; the rating IS the interaction.
 *
 * This file is a thin view over the pure session model in `flashcards-deck.ts`
 * (buildDeck + deckReducer, unit-tested there). Step 1 is fully in-memory: "Again"
 * requeues the card so it resurfaces this session, "Good" retires it, and the deck is
 * done when every card is Good. `options.srs` + localStorage are Step 2 (design §4).
 *
 * Direction: the learner flips the whole deck between Spanish→English (default,
 * recognition-first) and English→Spanish, unless `options.lockDirection` hides the
 * toggle. `target`/`native` are named by role, so the toggle just swaps which role
 * faces front. The audio speaker and `lang={TARGET_LANG}` always follow the `target`
 * (Spanish) side, wherever it currently renders.
 *
 * A11y: the card is a real <button> (keyboard-flippable); rating/toggle/restart are
 * real <button>s; the audio control is a sibling overlay (never nested in the card
 * button — a button-in-button is invalid HTML). Only target-language content is
 * wrapped in `lang={TARGET_LANG}`; all chrome stays `en`.
 *
 * Spec: docs/specs/2026-07-03-new-exercise-engines-design.md §4.
 */
import { useReducer, useState } from 'react';
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
import { buildDeck, deckReducer, initDeckState } from './flashcards-deck';
import './flashcards.css';

export default function FlashcardsExercise({ config }: ExerciseComponentProps) {
  const parsed = FlashcardsExerciseConfigSchema.safeParse(config);

  // Hooks must run unconditionally — build a safe initial deck even when the config
  // is invalid (the error UI returns before any of this state is read).
  const options = parsed.success ? FlashcardsOptionsSchema.parse(parsed.data.options ?? {}) : null;
  const content = parsed.success ? parsed.data.content : null;

  const [state, dispatch] = useReducer(
    deckReducer,
    { content, shuffle: options?.shuffle ?? false },
    (init) => initDeckState(init.content ? buildDeck(init.content, init.shuffle) : []),
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

  const { queue, flipped, known, total } = state;
  const current = queue[0];

  const handleToggleDirection = () =>
    setDirection((d) => (d === 'target-native' ? 'native-target' : 'target-native'));
  const handleRestart = () =>
    dispatch({ kind: 'restart', queue: buildDeck(content, options.shuffle) });

  if (!current) {
    return (
      <div className="flashcards">
        <p className="flashcards-status" role="status" aria-live="polite">
          Deck complete — {total} {total === 1 ? 'card' : 'cards'} learned.
        </p>
        <div className="flashcards-footer">
          <Button onClick={handleRestart}>Restart</Button>
        </div>
      </div>
    );
  }

  // Which role faces front, and whether the Spanish (target) side is currently visible.
  const targetOnFront = direction === 'target-native';
  const frontText = targetOnFront ? current.target : current.native;
  const backText = targetOnFront ? current.native : current.target;
  const targetVisible = targetOnFront ? !flipped : flipped;
  const showSpeaker = Boolean(current.audio) && targetVisible;
  const faceLang = (isTarget: boolean) => (isTarget ? TARGET_LANG : undefined);

  return (
    <div className="flashcards">
      <p className="flashcards-progress" role="status" aria-live="polite">
        Card {known + 1} of {total}
      </p>

      <div className="flashcards-card-wrap">
        <button
          type="button"
          className="flashcards-card"
          data-flipped={flipped}
          aria-pressed={flipped}
          aria-label={flipped ? 'Card back, click to flip to front' : 'Card front, click to flip'}
          onClick={() => dispatch({ kind: 'flip' })}
        >
          <span className="flashcards-card-inner">
            <span className="flashcards-face flashcards-face-front" aria-hidden={flipped}>
              <span className="flashcards-term" lang={faceLang(targetOnFront)}>
                {frontText}
              </span>
            </span>
            <span className="flashcards-face flashcards-face-back" aria-hidden={!flipped}>
              <span className="flashcards-term" lang={faceLang(!targetOnFront)}>
                {backText}
              </span>
              {current.image ? (
                <img className="flashcards-image" src={resolveAsset(current.image)} alt="" />
              ) : null}
            </span>
          </span>
        </button>

        {showSpeaker ? (
          <AudioClip
            className="super-compact-speaker flashcards-audio"
            soundFile={current.audio ?? ''}
            size={22}
            inline
          />
        ) : null}
      </div>

      <div className="flashcards-actions">
        {flipped ? (
          <>
            <Button variant="outline" onClick={() => dispatch({ kind: 'rate', grade: 'again' })}>
              Again
            </Button>
            <Button onClick={() => dispatch({ kind: 'rate', grade: 'good' })}>Good</Button>
          </>
        ) : (
          <Button onClick={() => dispatch({ kind: 'flip' })}>Flip</Button>
        )}
      </div>

      {content.footnote ? (
        <p className="flashcards-footnote" lang={TARGET_LANG}>
          {content.footnote}
        </p>
      ) : null}

      <div className="flashcards-footer">
        {options.lockDirection ? null : (
          <Button variant="ghost" onClick={handleToggleDirection}>
            Switch direction ({targetOnFront ? 'Spanish → English' : 'English → Spanish'})
          </Button>
        )}
        <Button variant="ghost" onClick={handleRestart}>
          Restart
        </Button>
      </div>
    </div>
  );
}
