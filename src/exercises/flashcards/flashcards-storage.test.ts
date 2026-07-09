import { test, expect, afterEach } from 'bun:test';
import { storageKey, loadSrsState, saveSrsState, clearSrsState } from './flashcards-storage';
import { initSrsState, gradeCard } from './srs-scheduler';
import type { FlashcardsContent } from './flashcards-schema';

const content = (n: number): FlashcardsContent => ({
  cards: Array.from({ length: n }, (_, i) => ({ target: `t${i}`, native: `n${i}` })),
});

/** A minimal in-memory Storage stand-in, installed on a fake `window` for a test. */
function installWindow(): Map<string, string> {
  const map = new Map<string, string>();
  const storage = {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  } as unknown as Storage;
  (globalThis as { window?: unknown }).window = { localStorage: storage };
  return map;
}

const realWarn = console.warn;
afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  console.warn = realWarn;
});

test('storageKey: stable for the same deck, distinct for different decks', () => {
  const a = content(3);
  expect(storageKey(a)).toBe(storageKey(content(3)));
  expect(storageKey(a)).not.toBe(storageKey(content(4)));
  expect(storageKey(a).startsWith('flashcards-srs:')).toBe(true);
});

test('loadSrsState: no window → in-memory fresh deck (never throws)', () => {
  // No window installed in this test → the storage boundary is skipped.
  const state = loadSrsState('any-key', ['0', '1']);
  expect(state).toEqual(initSrsState(['0', '1']));
});

test('loadSrsState: absent key → fresh deck', () => {
  installWindow();
  expect(loadSrsState('missing', ['0', '1'])).toEqual(initSrsState(['0', '1']));
});

test('save then load round-trips the scheduler state', () => {
  installWindow();
  const key = 'k1';
  const saved = gradeCard(initSrsState(['0', '1']), '0', 'good');
  saveSrsState(key, saved);
  expect(loadSrsState(key, ['0', '1'])).toEqual(saved);
});

test('loadSrsState: reconciles persisted state against the current deck ids', () => {
  installWindow();
  const key = 'k2';
  // Persisted state knows cards 0 + 1; the current deck is 0 + 2 (1 gone, 2 new).
  saveSrsState(key, gradeCard(initSrsState(['0', '1']), '0', 'good'));
  const loaded = loadSrsState(key, ['0', '2']);
  expect(loaded.cards['0'].box).toBe(2); // preserved
  expect(loaded.cards['2']).toEqual({ box: 1, due: 0 }); // added fresh
  expect(loaded.cards['1']).toBeUndefined(); // dropped
});

test('loadSrsState: corrupt JSON → fresh deck, warns (no throw, no silent swallow)', () => {
  const map = installWindow();
  let warned = false;
  console.warn = () => {
    warned = true;
  };
  map.set('bad', '{not valid json');
  expect(loadSrsState('bad', ['0'])).toEqual(initSrsState(['0']));
  expect(warned).toBe(true);
});

test('loadSrsState: schema-invalid JSON (box out of range) → fresh deck, warns', () => {
  const map = installWindow();
  let warned = false;
  console.warn = () => {
    warned = true;
  };
  map.set('inv', JSON.stringify({ step: 0, cards: { '0': { box: 99, due: 0 } } }));
  expect(loadSrsState('inv', ['0'])).toEqual(initSrsState(['0']));
  expect(warned).toBe(true);
});

test('clearSrsState: removes persisted progress so the next load is fresh', () => {
  installWindow();
  const key = 'k3';
  saveSrsState(key, gradeCard(initSrsState(['0']), '0', 'good'));
  clearSrsState(key);
  expect(loadSrsState(key, ['0'])).toEqual(initSrsState(['0']));
});

test('saveSrsState / clearSrsState: no window → silent no-op (never throws)', () => {
  expect(() => saveSrsState('k', initSrsState(['0']))).not.toThrow();
  expect(() => clearSrsState('k')).not.toThrow();
});
