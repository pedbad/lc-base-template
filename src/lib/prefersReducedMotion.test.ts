/**
 * Tests for prefersReducedMotion (§D · D4). Three branches, all of them load-bearing:
 *
 * 1. NO `window` → false. The suite runs in the `node` environment and the build
 *    prerenders 26 documents through `renderToStaticMarkup`, so any module that
 *    touches `matchMedia` at import time or during render breaks the prerender. This
 *    test is what makes the helper safe to import from a component file at all.
 * 2. NO `matchMedia` → false. Old and headless user agents expose `window` without it.
 * 3. `matches` is passed straight through, both ways.
 *
 * The stub is installed per-test and removed in `afterEach`, because the real DOM
 * globals do not exist here and a leaked `globalThis.window` would make every later
 * test in the run believe it has a browser.
 */
import { afterEach, describe, expect, test } from 'vitest';
import { prefersReducedMotion } from './prefersReducedMotion';

/** Install a `window` exposing `matchMedia`, recording the query it was asked. */
function stubWindow(matchMedia: unknown): void {
  (globalThis as { window?: unknown }).window = { matchMedia };
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe('prefersReducedMotion', () => {
  test('is false with no window at all — safe to call during prerender', () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  test('is false when the user agent has no matchMedia', () => {
    stubWindow(undefined);
    expect(prefersReducedMotion()).toBe(false);
  });

  test('is true when the reduce query matches', () => {
    stubWindow(() => ({ matches: true }));
    expect(prefersReducedMotion()).toBe(true);
  });

  test('is false when the reduce query does not match', () => {
    stubWindow(() => ({ matches: false }));
    expect(prefersReducedMotion()).toBe(false);
  });

  test('asks for the reduce query specifically, not some other motion query', () => {
    const asked: string[] = [];
    stubWindow((query: string) => {
      asked.push(query);
      return { matches: true };
    });
    prefersReducedMotion();
    expect(asked).toEqual(['(prefers-reduced-motion: reduce)']);
  });
});
