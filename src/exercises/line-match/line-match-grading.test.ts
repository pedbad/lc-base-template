import { test, expect } from 'bun:test';

import type { LineMatchItem } from './line-match-schema';
import { gradeLineMatch, fillLineMatchAnswers } from './line-match-grading';

const items = (...labels: string[]): LineMatchItem[] =>
  labels.map((label) => ({ label, image: `${label}.png` }));

test('gradeLineMatch: a picture matched to its own word is correct', () => {
  const { checkedResults } = gradeLineMatch(items('chat', 'chien'), { chat: 'chat' }, false);
  expect(checkedResults.chat).toBe(true);
});

test('gradeLineMatch: a picture matched to a different word is wrong', () => {
  const { checkedResults } = gradeLineMatch(items('chat', 'chien'), { chat: 'chien' }, false);
  expect(checkedResults.chat).toBe(false);
});

test('gradeLineMatch: unanswered pictures are skipped', () => {
  const { checkedResults } = gradeLineMatch(items('chat', 'chien'), { chien: 'chien' }, false);
  expect('chat' in checkedResults).toBe(false);
  expect(checkedResults.chien).toBe(true);
});

test('gradeLineMatch: mobile keeps recoiling/kept lists empty', () => {
  const { recoiling, keptConnections } = gradeLineMatch(items('chat'), { chat: 'chien' }, false);
  expect(recoiling).toEqual([]);
  expect(keptConnections).toEqual({});
});

test('gradeLineMatch: desktop keeps correct connectors and recoils wrong ones', () => {
  const result = gradeLineMatch(items('chat', 'chien'), { chat: 'chat', chien: 'chat' }, true);
  expect(result.keptConnections).toEqual({ chat: 'chat' });
  expect(result.recoiling).toEqual([{ sourceId: 'chien', targetId: 'chat' }]);
  expect(result.checkedResults).toEqual({ chat: true, chien: false });
});

test('fillLineMatchAnswers: connects each picture to its own word, all correct', () => {
  const { values, connections, checkedResults } = fillLineMatchAnswers(items('chat', 'chien'));
  expect(values).toEqual({ chat: 'chat', chien: 'chien' });
  expect(connections).toEqual({ chat: 'chat', chien: 'chien' });
  expect(checkedResults).toEqual({ chat: true, chien: true });
});

test('gradeLineMatch: uses explicit id over label when present', () => {
  const withId: LineMatchItem[] = [{ id: 'p1', label: 'chat', image: 'a.png' }];
  const { checkedResults } = gradeLineMatch(withId, { p1: 'p1' }, false);
  expect(checkedResults.p1).toBe(true);
});
