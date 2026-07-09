import { test, expect } from 'bun:test';
import {
  SRS_BOX_COUNT,
  SRS_MIN_BOX,
  initSrsState,
  intervalForBox,
  gradeCard,
  dueOrder,
  reconcileSrsState,
} from './srs-scheduler';

test('initSrsState: every card starts in box 1, due 0, step 0', () => {
  const state = initSrsState(['a', 'b']);
  expect(state.step).toBe(0);
  expect(state.cards).toEqual({
    a: { box: 1, due: 0 },
    b: { box: 1, due: 0 },
  });
});

test('intervalForBox: doubles per box (1, 2, 4, 8, 16)', () => {
  expect(intervalForBox(1)).toBe(1);
  expect(intervalForBox(2)).toBe(2);
  expect(intervalForBox(3)).toBe(4);
  expect(intervalForBox(4)).toBe(8);
  expect(intervalForBox(SRS_BOX_COUNT)).toBe(16);
});

test('gradeCard "good": promotes the box and fades the card further out', () => {
  const state = initSrsState(['a']); // a: box 1, due 0; step 0
  const next = gradeCard(state, 'a', 'good');
  expect(next.step).toBe(1);
  // box 1 -> 2, due = step(1) + interval(2)=2 => 3
  expect(next.cards.a).toEqual({ box: 2, due: 3 });
});

test('gradeCard "again": resets to box 1 so the card resurfaces soonest', () => {
  const promoted = gradeCard(gradeCard(initSrsState(['a']), 'a', 'good'), 'a', 'good');
  expect(promoted.cards.a.box).toBe(3);
  const missed = gradeCard(promoted, 'a', 'again');
  expect(missed.step).toBe(3);
  // reset to box 1, due = step(3) + interval(1)=1 => 4
  expect(missed.cards.a).toEqual({ box: 1, due: 4 });
});

test('gradeCard "good" at the top box stays capped (fades furthest, never overflows)', () => {
  let state = initSrsState(['a']);
  for (let i = 0; i < 10; i += 1) state = gradeCard(state, 'a', 'good');
  expect(state.cards.a.box).toBe(SRS_BOX_COUNT);
});

test('gradeCard is immutable — never mutates the input state', () => {
  const state = initSrsState(['a']);
  const snapshot = structuredClone(state);
  gradeCard(state, 'a', 'good');
  expect(state).toEqual(snapshot);
});

test('gradeCard: an unknown id is treated as a fresh box-1 card', () => {
  const state = initSrsState(['a']);
  const next = gradeCard(state, 'ghost', 'good');
  expect(next.cards.ghost).toEqual({ box: 2, due: 3 });
});

test('dueOrder: soonest-due card comes first; ties keep input order', () => {
  const base = initSrsState(['a', 'b', 'c']); // all due 0
  let state = gradeCard(base, 'b', 'good');
  state = gradeCard(state, 'b', 'good');
  state = gradeCard(state, 'a', 'good');
  const order = dueOrder(state, ['a', 'b', 'c']);
  expect(order[0]).toBe('c'); // still due 0, soonest
  expect(order[order.length - 1]).toBe('b'); // faded furthest
});

test('dueOrder: cards absent from state sort as fresh (due 0), stable by input order', () => {
  const state = initSrsState(['a']);
  expect(dueOrder(state, ['x', 'y', 'z'])).toEqual(['x', 'y', 'z']);
});

test('reconcileSrsState: keeps known cards, adds missing as fresh, drops stale ids', () => {
  const stored = gradeCard(initSrsState(['a', 'b']), 'a', 'good');
  const reconciled = reconcileSrsState(stored, ['a', 'c']);
  expect(reconciled.cards.a).toEqual(stored.cards.a); // preserved
  expect(reconciled.cards.c).toEqual({ box: SRS_MIN_BOX, due: 0 }); // added fresh
  expect(reconciled.cards.b).toBeUndefined(); // dropped
  expect(reconciled.step).toBe(stored.step); // step carried over
});
