/**
 * flip-cue-store.test.ts — the saved "this exercise's flip cue has retired" flag
 * (TODO §E21). Stored values are untrusted and storage may be missing or throw.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  flipCueKey,
  isFlipCueRetired,
  restoreFlipCue,
  retireFlipCue,
  subscribeFlipCue,
} from './flip-cue-store';

/** A minimal in-memory Storage on a fake `window`, as flashcards-storage.test.ts does. */
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

/** A storage whose every call throws, as Safari's private mode once did. */
function installThrowingWindow(): void {
  const fail = () => {
    throw new Error('denied');
  };
  const storage = { getItem: fail, setItem: fail, removeItem: fail } as unknown as Storage;
  (globalThis as { window?: unknown }).window = { localStorage: storage };
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  vi.restoreAllMocks();
});

describe('flipCueKey', () => {
  test('is the course base plus the progress id, like flashcards progress', () => {
    expect(flipCueKey('/', 'lo-03-food/02-flashcards')).toBe(
      'flip-cue:v1:/lo-03-food/02-flashcards',
    );
    expect(flipCueKey('/course/', 'lo-01-a/04-memory-match')).toBe(
      'flip-cue:v1:/course/lo-01-a/04-memory-match',
    );
  });
});

describe('isFlipCueRetired', () => {
  test('is false with no key (an exercise that saves nothing)', () => {
    installWindow();
    expect(isFlipCueRetired(null)).toBe(false);
  });

  test('is false with no window (the prerender)', () => {
    expect(isFlipCueRetired('k')).toBe(false);
  });

  test('is false until retired, then true', () => {
    installWindow();
    expect(isFlipCueRetired('k')).toBe(false);
    retireFlipCue('k');
    expect(isFlipCueRetired('k')).toBe(true);
  });

  test('ignores any other stored value', () => {
    const map = installWindow();
    map.set('k', '{"junk":true}');
    expect(isFlipCueRetired('k')).toBe(false);
  });

  test('is false, with a warning, when storage throws', () => {
    installThrowingWindow();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(isFlipCueRetired('k')).toBe(false);
    expect(warn).toHaveBeenCalledOnce();
  });

  test('keeps exercises apart', () => {
    installWindow();
    retireFlipCue('a');
    expect(isFlipCueRetired('b')).toBe(false);
  });
});

describe('retireFlipCue', () => {
  test('tells subscribers, who stop hearing once they unsubscribe', () => {
    installWindow();
    const listener = vi.fn();
    const unsubscribe = subscribeFlipCue(listener);
    retireFlipCue('k');
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    retireFlipCue('k');
    expect(listener).toHaveBeenCalledOnce();
  });

  test('does nothing with no key or no window', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeFlipCue(listener);
    retireFlipCue(null);
    retireFlipCue('k');
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  test('warns, and does not throw, when storage throws', () => {
    installThrowingWindow();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => retireFlipCue('k')).not.toThrow();
    expect(warn).toHaveBeenCalledOnce();
  });
});

// Flashcards' Clear saved progress brings the corner back (maintainer, 2026-10-16).
describe('restoreFlipCue', () => {
  test('forgets the retirement and tells subscribers', () => {
    installWindow();
    retireFlipCue('k');
    const listener = vi.fn();
    const unsubscribe = subscribeFlipCue(listener);
    restoreFlipCue('k');
    expect(isFlipCueRetired('k')).toBe(false);
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });

  test('does nothing with no key or no window', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeFlipCue(listener);
    restoreFlipCue(null);
    restoreFlipCue('k');
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  test('warns, and does not throw, when storage throws', () => {
    installThrowingWindow();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => restoreFlipCue('k')).not.toThrow();
    expect(warn).toHaveBeenCalledOnce();
  });
});
