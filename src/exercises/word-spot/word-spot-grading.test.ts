import { test, expect } from 'vitest';

import { buildModel, scoreWordSpot } from './word-spot-grading';
import type { WordSpotContent } from './word-spot-schema';

const content = (...texts: string[]): WordSpotContent =>
  ({ items: texts.map((text) => ({ text })) }) as WordSpotContent;

test('buildModel: extracts one target key per bracketed run', () => {
  const { targetKeys } = buildModel(content('je [mange] une [pomme]'));
  expect(targetKeys).toEqual(['t-0', 't-1']);
});

test('buildModel: marks bracketed words as targets and others as distractors', () => {
  const { rows } = buildModel(content('je [mange]'));
  const tokens = rows[0].nodes.filter((n) => n.kind === 'token').map((n) => n.token);
  const targets = tokens.filter((t) => t.isTarget);
  const distractors = tokens.filter((t) => !t.isTarget);
  expect(targets.map((t) => t.text)).toEqual(['mange']);
  expect(distractors.map((t) => t.text)).toEqual(['je']);
});

test('buildModel: keys stay unique across rows', () => {
  const { rows, targetKeys } = buildModel(content('[un] chat', 'le [chien]'));
  const allKeys = rows.flatMap((row) =>
    row.nodes.map((n) => (n.kind === 'token' ? n.token.key : n.key)),
  );
  expect(new Set(allKeys).size).toBe(allKeys.length);
  expect(targetKeys).toEqual(['t-0', 't-1']);
});

test('scoreWordSpot: counts hits on targets', () => {
  const score = scoreWordSpot({ 't-0': 'hit' }, ['t-0', 't-1']);
  expect(score.hits).toBe(1);
  expect(score.total).toBe(2);
  expect(score.complete).toBe(false);
});

test('scoreWordSpot: complete when all targets are hit', () => {
  const score = scoreWordSpot({ 't-0': 'hit', 't-1': 'hit' }, ['t-0', 't-1']);
  expect(score.complete).toBe(true);
});

test('scoreWordSpot: counts misses on distractors', () => {
  const score = scoreWordSpot({ 't-0': 'hit', 'r0-x-0': 'miss' }, ['t-0']);
  expect(score.hits).toBe(1);
  expect(score.misses).toBe(1);
  expect(score.complete).toBe(true); // all targets found despite a miss
});

test('scoreWordSpot: a hit key not in targetKeys is not counted (defensive)', () => {
  const score = scoreWordSpot({ ghost: 'hit' }, ['t-0']);
  expect(score.hits).toBe(0);
});

test('scoreWordSpot: hasAttempted reflects any hit or miss', () => {
  expect(scoreWordSpot({}, ['t-0']).hasAttempted).toBe(false);
  expect(scoreWordSpot({ 'r0-x-0': 'miss' }, ['t-0']).hasAttempted).toBe(true);
});
