/**
 * Tests for resolveAsset. Under `bun test` there is no Vite `import.meta.env`, so
 * BASE_URL falls back to "/" — these assert the root-served behaviour.
 */
import { expect, test } from 'vitest';
import { resolveAsset, resolveHomeHref, storageScope } from './assets';

test('resolveHomeHref: is the base path itself, ending in a slash', () => {
  // Root-served base under the test runner; the guarantee being locked is that it is
  // never the empty string, which would re-load the current page instead of home.
  expect(resolveHomeHref()).toBe('/');
  expect(resolveHomeHref().endsWith('/')).toBe(true);
});

test('resolveAsset: empty path returns empty', () => {
  expect(resolveAsset('')).toBe('');
  expect(resolveAsset()).toBe('');
});

test('resolveAsset: absolute http(s) URLs pass through untouched', () => {
  expect(resolveAsset('https://cdn.example.com/a.mp3')).toBe('https://cdn.example.com/a.mp3');
  expect(resolveAsset('http://example.com/a.png')).toBe('http://example.com/a.png');
});

test('resolveAsset: root-relative and project-relative paths resolve under base "/"', () => {
  expect(resolveAsset('/audio/q1.mp3')).toBe('/audio/q1.mp3');
  expect(resolveAsset('audio/q1.mp3')).toBe('/audio/q1.mp3');
});

test('resolveAsset: spaces and accents are URI-encoded', () => {
  expect(resolveAsset('audio/à bientôt.mp3')).toBe(
    encodeURI('/audio/à bientôt.mp3'.normalize('NFD')),
  );
});

test('storageScope: an absolute base is the scope already, browser or not', () => {
  expect(storageScope('/courses/spanish-1/', undefined)).toBe('/courses/spanish-1/');
  expect(storageScope('/courses/spanish-1/', 'https://x.test/elsewhere/page.html')).toBe(
    '/courses/spanish-1/',
  );
});

test('storageScope: a ./ build takes the folder the page is served from', () => {
  // Two courses from one build on one server must not share saved progress: the
  // scope is the folder of the page, which only the browser knows.
  expect(storageScope('./', 'https://x.test/courses/spanish-1/example.html')).toBe(
    '/courses/spanish-1/',
  );
  expect(storageScope('./', 'https://x.test/courses/french-1/')).toBe('/courses/french-1/');
});

test('storageScope: a ./ build with no page address (the prerender) stays ./', () => {
  expect(storageScope('./', undefined)).toBe('./');
});
