/**
 * preset-choice.test.ts — where the previewed preset is remembered: this browser's
 * localStorage, per viewer, and never a reason for a page to throw.
 */
import { describe, expect, it } from 'vitest';
import { PRESET_STORAGE_KEY, chosenPreset, readChoice, writeChoice } from './preset-choice';

/** A Storage stand-in backed by a Map. */
function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, value),
  };
}

/** Storage that refuses every call, as Safari's private mode and blocked cookies do. */
const brokenStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
  removeItem: () => {
    throw new Error('SecurityError');
  },
} as unknown as Storage;

describe('preset choice', () => {
  it('is null until something is chosen', () => {
    expect(readChoice(memoryStorage())).toBeNull();
  });

  it('remembers the chosen preset id under one key', () => {
    const storage = memoryStorage();
    writeChoice(storage, 'c-warm-blue');
    expect(readChoice(storage)).toBe('c-warm-blue');
    expect(storage.getItem(PRESET_STORAGE_KEY)).toBe('c-warm-blue');
  });

  it('forgets it on reset', () => {
    const storage = memoryStorage();
    writeChoice(storage, 'c-warm-blue');
    writeChoice(storage, null);
    expect(readChoice(storage)).toBeNull();
    expect(storage.length).toBe(0);
  });

  it('reads as "no choice" when storage refuses, rather than throwing', () => {
    expect(readChoice(brokenStorage)).toBeNull();
  });

  it('carries on when storage refuses a write', () => {
    expect(() => writeChoice(brokenStorage, 'a-cambridge-blue')).not.toThrow();
    expect(() => writeChoice(brokenStorage, null)).not.toThrow();
  });
});

describe('chosenPreset', () => {
  const presets = [{ id: 'a-cambridge-blue' }, { id: 'z-test' }];

  it('finds the remembered preset among the ones this page knows', () => {
    const storage = memoryStorage();
    writeChoice(storage, 'z-test');
    expect(chosenPreset(storage, presets)).toEqual({ id: 'z-test' });
  });

  it('is undefined when nothing is chosen', () => {
    expect(chosenPreset(memoryStorage(), presets)).toBeUndefined();
  });

  // The bug this caught (2026-10-16): a tab opened before a palette file was added
  // read the newer tab's choice, did not know it, and deleted it, so the drop-down
  // seemed to do nothing. A page that does not know a preset shows the real colours
  // and leaves the choice for the pages that do.
  it('leaves a choice it does not know in place', () => {
    const storage = memoryStorage();
    writeChoice(storage, 'french');
    expect(chosenPreset(storage, presets)).toBeUndefined();
    expect(readChoice(storage)).toBe('french');
  });
});
