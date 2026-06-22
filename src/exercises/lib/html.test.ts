/**
 * Tests for decodeHtmlEntities. Run under bun (no `document`), so these cover the
 * two non-browser branches: the fast-path (no `&`) and the `&apos;` SSR fallback.
 * Full named/numeric entity decoding is browser-only (delegates to a <textarea>)
 * and is therefore not exercised here.
 */
import { describe, expect, test } from 'bun:test';
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
});
