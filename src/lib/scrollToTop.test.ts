/**
 * Tests for scrollToTop (§D · D4) — the reduced-motion-aware jump to the top.
 *
 * THIS IS THE DEFECT THE REFERENCE SHIPPED. Its BackToTopButton called
 * `scrollTo({ behavior: 'smooth' })` with no reduced-motion guard anywhere in the
 * file, so a reader who has asked their OS for less motion got a full smooth scroll
 * of the whole document. `behavior: 'auto'` is the honest answer: an instant jump.
 *
 * It lives in `src/lib/` rather than beside the button because the `node` test
 * environment has no DOM and the shell forbids a non-component export from a
 * component file (`react-refresh/only-export-components`) — so a module is the only
 * place this logic is both reachable and testable. The button is then pure markup.
 */
import { afterEach, describe, expect, test } from 'vitest';
import { scrollToTop } from './scrollToTop';

interface Recorded {
  readonly calls: ScrollToOptions[];
}

/** Install a `window` with a recording `scrollTo` and a fixed reduce answer. */
function stubWindow(reduce: boolean): Recorded {
  const calls: ScrollToOptions[] = [];
  (globalThis as { window?: unknown }).window = {
    scrollTo: (options: ScrollToOptions) => calls.push(options),
    matchMedia: (query: string) => ({ matches: reduce && query.includes('reduced-motion') }),
  };
  return { calls };
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe('scrollToTop', () => {
  test('scrolls smoothly to the very top by default', () => {
    const { calls } = stubWindow(false);
    scrollToTop();
    expect(calls).toEqual([{ top: 0, left: 0, behavior: 'smooth' }]);
  });

  test('jumps instantly when the reader prefers reduced motion', () => {
    const { calls } = stubWindow(true);
    scrollToTop();
    expect(calls).toEqual([{ top: 0, left: 0, behavior: 'auto' }]);
  });

  test('does nothing at all with no window — never throws during prerender', () => {
    expect(() => scrollToTop()).not.toThrow();
  });
});
