import { test, expect } from 'bun:test';

import type { DragFillGapsContent } from './drag-fill-gaps-schema';
import {
  bankOrderFor,
  buildModel,
  checkPlacements,
  fillPlacements,
  type Tile,
} from './drag-fill-gaps-grading';

const content = (...texts: string[]): DragFillGapsContent =>
  ({ items: texts.map((text) => ({ text })) }) as DragFillGapsContent;

const tiles = (n: number): Tile[] =>
  Array.from({ length: n }, (_, i) => ({ id: `tile-${i}`, word: `w${i}` }));

test('buildModel: one tile per bracketed blank, keyed by order', () => {
  const { tiles: built } = buildModel(content('je [mange] le [pain]'));
  expect(built).toEqual([
    { id: 'tile-0', word: 'mange' },
    { id: 'tile-1', word: 'pain' },
  ]);
});

test('buildModel: numbers blanks across multiple rows', () => {
  const { tiles: built } = buildModel(content('[un] chat', 'le [chien]'));
  expect(built.map((t) => t.id)).toEqual(['tile-0', 'tile-1']);
});

test('bankOrderFor: no shuffle keeps tile-id order', () => {
  expect(bankOrderFor(tiles(3), false)).toEqual(['tile-0', 'tile-1', 'tile-2']);
});

test('bankOrderFor: shuffle preserves the id set', () => {
  const order = bankOrderFor(tiles(4), true, () => 0.37);
  expect([...order].sort()).toEqual(['tile-0', 'tile-1', 'tile-2', 'tile-3']);
});

test('checkPlacements: correct tile locks, wrong tile bounces to bank', () => {
  const result = checkPlacements(
    tiles(2),
    { 'tile-0': 'tile-0', 'tile-1': 'tile-0' }, // slot 1 holds the wrong tile
    { 'tile-0': false, 'tile-1': false },
  );
  expect(result.locked['tile-0']).toBe(true);
  expect(result.assignments['tile-1']).toBe(null); // bounced
  expect(result.anyWrong).toBe(true);
  expect(result.complete).toBe(false);
});

test('checkPlacements: all-correct placement completes', () => {
  const result = checkPlacements(
    tiles(2),
    { 'tile-0': 'tile-0', 'tile-1': 'tile-1' },
    { 'tile-0': false, 'tile-1': false },
  );
  expect(result.anyWrong).toBe(false);
  expect(result.complete).toBe(true);
  expect(result.locked).toEqual({ 'tile-0': true, 'tile-1': true });
});

test('checkPlacements: empty slots are left untouched (not wrong)', () => {
  const result = checkPlacements(
    tiles(2),
    { 'tile-0': 'tile-0', 'tile-1': null },
    { 'tile-0': false, 'tile-1': false },
  );
  expect(result.anyWrong).toBe(false);
  expect(result.locked['tile-1']).toBe(false);
});

test('checkPlacements: already-locked slots are preserved', () => {
  const result = checkPlacements(tiles(1), { 'tile-0': 'tile-0' }, { 'tile-0': true });
  expect(result.locked['tile-0']).toBe(true);
  expect(result.complete).toBe(true);
});

test('fillPlacements: every tile in its home slot, all locked', () => {
  const { assignments, locked } = fillPlacements(tiles(2));
  expect(assignments).toEqual({ 'tile-0': 'tile-0', 'tile-1': 'tile-1' });
  expect(locked).toEqual({ 'tile-0': true, 'tile-1': true });
});
