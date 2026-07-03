import { test, expect, afterEach } from 'bun:test';
import { buildDeck, deckReducer, initDeckState } from './flashcards-deck';

const realRandom = Math.random;
afterEach(() => {
  Math.random = realRandom;
});

test('buildDeck: keeps authored order when shuffle is off and assigns stable ids', () => {
  const deck = buildDeck(
    {
      cards: [
        { target: 'uno', native: 'one' },
        { target: 'dos', native: 'two' },
      ],
    },
    false,
  );
  expect(deck.map((c) => c.target)).toEqual(['uno', 'dos']);
  expect(deck.map((c) => c.id)).toEqual(['0', '1']);
});

test('buildDeck: reorders cards when shuffle is on', () => {
  // Force Fisher-Yates to swap index 2 then index 1 into position, reversing 3 cards.
  const randoms = [0, 0];
  Math.random = () => randoms.shift() ?? 0;
  const deck = buildDeck(
    {
      cards: [
        { target: 'uno', native: 'one' },
        { target: 'dos', native: 'two' },
        { target: 'tres', native: 'three' },
      ],
    },
    true,
  );
  // ids stay authored (0,1,2) but order changes; the multiset is preserved.
  expect(deck.map((c) => c.target).sort()).toEqual(['dos', 'tres', 'uno']);
  expect(deck.map((c) => c.target)).not.toEqual(['uno', 'dos', 'tres']);
});

test('deckReducer: flip toggles the current face', () => {
  const state = initDeckState(buildDeck({ cards: [{ target: 'uno', native: 'one' }] }, false));
  expect(state.flipped).toBe(false);
  const flipped = deckReducer(state, { kind: 'flip' });
  expect(flipped.flipped).toBe(true);
  expect(deckReducer(flipped, { kind: 'flip' }).flipped).toBe(false);
});

test('deckReducer: Good retires the card, advances, and resets the face', () => {
  const state = deckReducer(
    initDeckState(
      buildDeck(
        {
          cards: [
            { target: 'uno', native: 'one' },
            { target: 'dos', native: 'two' },
          ],
        },
        false,
      ),
    ),
    { kind: 'flip' },
  );
  const next = deckReducer(state, { kind: 'rate', grade: 'good' });
  expect(next.queue.map((c) => c.target)).toEqual(['dos']);
  expect(next.known).toBe(1);
  expect(next.flipped).toBe(false);
});

test('deckReducer: Again requeues the card to the back and does not count it known', () => {
  const state = initDeckState(
    buildDeck(
      {
        cards: [
          { target: 'uno', native: 'one' },
          { target: 'dos', native: 'two' },
        ],
      },
      false,
    ),
  );
  const next = deckReducer(state, { kind: 'rate', grade: 'again' });
  expect(next.queue.map((c) => c.target)).toEqual(['dos', 'uno']);
  expect(next.known).toBe(0);
  expect(next.flipped).toBe(false);
});

test('deckReducer: the deck completes only after every card is rated Good', () => {
  let state = initDeckState(
    buildDeck(
      {
        cards: [
          { target: 'uno', native: 'one' },
          { target: 'dos', native: 'two' },
        ],
      },
      false,
    ),
  );
  state = deckReducer(state, { kind: 'rate', grade: 'again' }); // uno → back
  state = deckReducer(state, { kind: 'rate', grade: 'good' }); // dos retired
  state = deckReducer(state, { kind: 'rate', grade: 'good' }); // uno retired
  expect(state.queue).toHaveLength(0);
  expect(state.known).toBe(2);
});

test('deckReducer: restart rebuilds the queue and resets progress', () => {
  let state = initDeckState(buildDeck({ cards: [{ target: 'uno', native: 'one' }] }, false));
  state = deckReducer(state, { kind: 'rate', grade: 'good' });
  expect(state.queue).toHaveLength(0);
  const fresh = buildDeck({ cards: [{ target: 'uno', native: 'one' }] }, false);
  const restarted = deckReducer(state, { kind: 'restart', queue: fresh });
  expect(restarted.queue).toHaveLength(1);
  expect(restarted.known).toBe(0);
  expect(restarted.flipped).toBe(false);
});
