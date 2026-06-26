/**
 * Tests for resolveAsset. Under `bun test` there is no Vite `import.meta.env`, so
 * BASE_URL falls back to "/" — these assert the root-served behaviour.
 */
import { expect, test } from 'bun:test';
import { resolveAsset } from './assets';

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
