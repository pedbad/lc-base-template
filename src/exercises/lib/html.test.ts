/**
 * Tests for decodeHtmlEntities. Run under bun (no `document`), so these cover the
 * two non-browser branches: the fast-path (no `&`) and the `&apos;` SSR fallback.
 * Full named/numeric entity decoding is browser-only (delegates to a <textarea>)
 * and is therefore not exercised here.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { decodeHtmlEntities } from './html';

describe('decodeHtmlEntities', () => {
  test('returns plain text unchanged (fast path, no entities)', () => {
    expect(decodeHtmlEntities('no entities here')).toBe('no entities here');
  });

  test('returns empty string for empty input', () => {
    expect(decodeHtmlEntities('')).toBe('');
  });

  test('decodes &apos; to an apostrophe (SSR fallback)', () => {
    expect(decodeHtmlEntities('l&apos;école')).toBe("l'école");
  });

  test('decodes every &apos; occurrence', () => {
    expect(decodeHtmlEntities('d&apos;un&apos;a')).toBe("d'un'a");
  });

  test('coerces non-string input to string', () => {
    expect(decodeHtmlEntities(42 as unknown as string)).toBe('42');
  });

  test('defaults to empty string when called with no argument', () => {
    expect(decodeHtmlEntities()).toBe('');
  });

  // Browser branch. The suite runs in Node, so `document` is stubbed with the one
  // thing the branch touches — an element whose `value` reads back decoded markup.
  describe('in a browser', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    test('decodes through an off-screen textarea, not the &apos;-only fallback', () => {
      const created: string[] = [];
      vi.stubGlobal('document', {
        createElement: (tag: string) => {
          created.push(tag);
          let markup = '';
          return {
            set innerHTML(value: string) {
              markup = value;
            },
            get value() {
              return markup.replaceAll('&eacute;', 'é').replaceAll('&lt;', '<');
            },
          };
        },
      });

      expect(decodeHtmlEntities('caf&eacute; &lt;b')).toBe('café <b');
      expect(created).toEqual(['textarea']);
    });

    test('still skips the parser when there is no "&"', () => {
      const createElement = vi.fn();
      vi.stubGlobal('document', { createElement });

      expect(decodeHtmlEntities('plain')).toBe('plain');
      expect(createElement).not.toHaveBeenCalled();
    });
  });
});
