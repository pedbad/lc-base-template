/**
 * Tests for decodeHtmlEntities. The decoder is the same code in Node (the build, the
 * prerender, these tests) and in the browser, so one table of cases holds for both; the
 * "in a browser" block runs it again with a `document` present to show it is not used.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { decodeHtmlEntities } from './html';

/** Named, decimal and hexadecimal forms, and what each must read as. */
const CASES: Array<[string, string]> = [
  ['no entities here', 'no entities here'],
  ['l&apos;école', "l'école"],
  ['d&apos;un&apos;a', "d'un'a"],
  ['caf&eacute;', 'café'],
  ['caf&#233;', 'café'],
  ['caf&#xE9;', 'café'],
  ['caf&#Xe9;', 'café'],
  ['&lt;b&gt; &amp; &quot;', '<b> & "'],
  ['a&nbsp;b', 'a b'],
];

describe('decodeHtmlEntities', () => {
  test.each(CASES)('decodes %j to %j', (written, shown) => {
    expect(decodeHtmlEntities(written)).toBe(shown);
  });

  test('decodes once: an encoded ampersand stays an ampersand, not a second entity', () => {
    expect(decodeHtmlEntities('&amp;eacute; &amp;#124;')).toBe('&eacute; &#124;');
  });

  test('leaves an ampersand that starts no entity as written', () => {
    expect(decodeHtmlEntities('Tom & Jerry &unknownentity;')).toBe('Tom & Jerry &unknownentity;');
  });

  test('returns empty string for empty input', () => {
    expect(decodeHtmlEntities('')).toBe('');
  });

  test('coerces non-string input to string', () => {
    expect(decodeHtmlEntities(42 as unknown as string)).toBe('42');
  });

  test('defaults to empty string when called with no argument', () => {
    expect(decodeHtmlEntities()).toBe('');
  });

  // The browser once decoded through an off-screen <textarea> and Node only `&apos;`, so
  // the prerendered page and the build's checks read text the learner never saw (E35).
  describe('in a browser', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    test('decodes exactly as in Node, without touching the DOM', () => {
      const createElement = vi.fn();
      vi.stubGlobal('document', { createElement });

      for (const [written, shown] of CASES) expect(decodeHtmlEntities(written)).toBe(shown);
      expect(createElement).not.toHaveBeenCalled();
    });
  });
});
