/**
 * showcase-audio-assets.test.ts — keeps the showcase's PLACEHOLDER audio quarantined
 * and real, on disk.
 *
 * Two rules, both about the same thing: the demo clips that exist only to make the
 * exercise showcase playable must never get mixed in with the real course audio an
 * author adds later.
 *
 *   1. Every `audio` path used by any showcase fixture lives under
 *      `audio/showcase-demo/` — so `public/audio/` stays clean for real content.
 *   2. Every such path resolves to a file that actually exists in `public/`.
 *
 * Seed of the asset-path / asset-existence guards (c + e).
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { SHOWCASE_FIXTURES } from './fixtures';

/** Where the demo-only clips are quarantined, relative to `public/`. */
const SHOWCASE_AUDIO_PREFIX = 'audio/showcase-demo/';

const PUBLIC_DIR = path.resolve(import.meta.dirname, '../../public');

/** Collect every `audio` string value anywhere in a fixture config tree. */
function collectAudioPaths(value: unknown, found: string[] = []): string[] {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectAudioPaths(entry, found));
    return found;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      if (key === 'audio' && typeof entry === 'string') {
        found.push(entry);
      } else {
        collectAudioPaths(entry, found);
      }
    }
  }
  return found;
}

const audioPaths = [
  ...new Set(SHOWCASE_FIXTURES.flatMap((fixture) => collectAudioPaths(fixture.config))),
];

describe('showcase placeholder audio', () => {
  it('is referenced by at least one fixture (the walker actually found paths)', () => {
    expect(audioPaths.length).toBeGreaterThan(0);
  });

  it.each(audioPaths)('"%s" is quarantined under audio/showcase-demo/', (audioPath) => {
    expect(audioPath.replace(/^\//, '').startsWith(SHOWCASE_AUDIO_PREFIX)).toBe(true);
  });

  it.each(audioPaths)('"%s" exists in public/', (audioPath) => {
    const file = path.join(PUBLIC_DIR, audioPath.replace(/^\//, ''));
    expect(existsSync(file), `missing ${file}`).toBe(true);
  });
});
