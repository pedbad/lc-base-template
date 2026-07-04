import { test, expect } from 'bun:test';

import type { DeckCard } from './MemoryCard';
import type { MemoryMatchContent } from './memory-match-schema';
import { buildDeck, solveOrder } from './memory-match-grading';

const content = (...pairs: Array<{ text: string; image: string }>): MemoryMatchContent =>
  ({ items: pairs }) as MemoryMatchContent;

const pair = (text: string, image: string): { text: string; image: string } => ({ text, image });

test('buildDeck: two cards (image + text) per pair', () => {
  const deck = buildDeck(content(pair('chat', 'chat.png'), pair('chien', 'chien.png')));
  expect(deck.length).toBe(4);
  expect(deck.filter((c) => c.kind === 'image').length).toBe(2);
  expect(deck.filter((c) => c.kind === 'text').length).toBe(2);
});

test('buildDeck: image and text halves of a pair share a pairId', () => {
  const deck = buildDeck(content(pair('chat', 'chat.png')));
  const [img] = deck.filter((c) => c.kind === 'image');
  const [txt] = deck.filter((c) => c.kind === 'text');
  expect(img.pairId).toBe(txt.pairId);
  expect(img.id).not.toBe(txt.id);
});

test('buildDeck: sampleSize limits the number of pairs', () => {
  const deck = buildDeck(
    content(pair('a', 'a.png'), pair('b', 'b.png'), pair('c', 'c.png')),
    2,
    () => 0.1,
  );
  expect(deck.length).toBe(4); // 2 pairs × 2 cards
});

test('buildDeck: text card carries the word, image card the asset', () => {
  const deck = buildDeck(content(pair('chat', 'chat.png')), undefined, () => 0.5);
  const text = deck.find((c) => c.kind === 'text');
  const image = deck.find((c) => c.kind === 'image');
  expect(text?.text).toBe('chat');
  expect(image?.image).toBe('chat.png');
});

test('solveOrder: reorders scrambled deck into image→text pairs by numeric pairId', () => {
  const deck: DeckCard[] = [
    { id: '1-txt', pairId: '1', kind: 'text', text: 'b', alt: 'b' },
    { id: '0-txt', pairId: '0', kind: 'text', text: 'a', alt: 'a' },
    { id: '1-img', pairId: '1', kind: 'image', image: 'b.png', alt: '' },
    { id: '0-img', pairId: '0', kind: 'image', image: 'a.png', alt: '' },
  ];
  expect(solveOrder(deck).map((c) => c.id)).toEqual(['0-img', '0-txt', '1-img', '1-txt']);
});

test('solveOrder: drops a pair missing a half (defensive filter)', () => {
  const deck: DeckCard[] = [
    { id: '0-img', pairId: '0', kind: 'image', image: 'a.png', alt: '' },
    { id: '0-txt', pairId: '0', kind: 'text', text: 'a', alt: 'a' },
    { id: '1-img', pairId: '1', kind: 'image', image: 'b.png', alt: '' },
  ];
  expect(solveOrder(deck).map((c) => c.id)).toEqual(['0-img', '0-txt', '1-img']);
});
