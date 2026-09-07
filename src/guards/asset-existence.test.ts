/**
 * asset-existence.test.ts — guard d (buildlist 22).
 *
 * Guard c proved an authored path is BUILT correctly. This proves the file it points
 * at is actually there. Same failure to a learner either way — a silent audio button,
 * a broken image — but a different cause, so a different guard.
 */
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ASSET_KEYS,
  authoredAssetPaths,
  collectAssetPaths,
  findMissingAssets,
} from './asset-existence';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');

describe('collectAssetPaths — pulls authored paths out of a config tree', () => {
  it('finds an asset key at the top level', () => {
    expect(collectAssetPaths({ image: 'images/hero.png' })).toEqual(['images/hero.png']);
  });

  it('finds them nested through objects and arrays', () => {
    const config = {
      content: { cards: [{ audio: 'audio/a.mp3' }, { audio: 'audio/b.mp3', image: 'img/c.svg' }] },
    };
    expect(collectAssetPaths(config).sort()).toEqual(['audio/a.mp3', 'audio/b.mp3', 'img/c.svg']);
  });

  it('ignores non-asset keys, so prose is never mistaken for a path', () => {
    expect(collectAssetPaths({ title: 'audio/not-a-path.mp3', text: 'hello' })).toEqual([]);
  });

  it('ignores absolute URLs — those are somebody else’s server', () => {
    expect(collectAssetPaths({ audio: 'https://cdn.example.com/a.mp3' })).toEqual([]);
  });

  it('ignores empty and non-string values', () => {
    expect(collectAssetPaths({ audio: '', image: null, poster: 42 })).toEqual([]);
  });
});

describe('findMissingAssets', () => {
  it('reports a path with no file behind it', () => {
    const missing = findMissingAssets(['audio/nope/missing.mp3'], PUBLIC_DIR, 'fake.json');
    expect(missing).toHaveLength(1);
    expect(missing[0]?.value).toBe('audio/nope/missing.mp3');
    expect(missing[0]?.source).toBe('fake.json');
  });

  it('passes a path that exists, with or without a leading slash', () => {
    expect(findMissingAssets(['images/lo-placeholder.svg'], PUBLIC_DIR)).toEqual([]);
    expect(findMissingAssets(['/images/lo-placeholder.svg'], PUBLIC_DIR)).toEqual([]);
  });

  // resolveAsset() NFD-normalises requests because Mac-authored filenames are usually
  // NFD on disk. The guard has to accept either form or it would fail an accented
  // filename that works perfectly in the browser.
  it('matches a file whichever unicode normalisation the author typed', () => {
    const nfc = 'audio/showcase-demo/flashcards/circulo.m4a'.normalize('NFC');
    const nfd = nfc.normalize('NFD');
    expect(findMissingAssets([nfc], PUBLIC_DIR)).toEqual([]);
    expect(findMissingAssets([nfd], PUBLIC_DIR)).toEqual([]);
  });
});

describe('the repo itself obeys guard d', () => {
  const authored = authoredAssetPaths(REPO_ROOT);

  // If a schema renames its asset field, ASSET_KEYS goes stale and the guard would
  // quietly pass by finding nothing. Assert it is still finding paths.
  it('finds authored asset paths to check (the collector has not gone stale)', () => {
    expect(ASSET_KEYS.length).toBeGreaterThan(0);
    expect(authored.length).toBeGreaterThan(10);
  });

  it('covers both LO config and showcase fixtures', () => {
    expect(authored.some((entry) => entry.source.startsWith('lo-config/'))).toBe(true);
    expect(authored.some((entry) => entry.source.startsWith('fixture:'))).toBe(true);
  });

  it('has a real file behind every authored asset path', () => {
    const missing = authored.flatMap((entry) =>
      findMissingAssets([entry.value], PUBLIC_DIR, entry.source),
    );
    expect(
      missing,
      `these are referenced but not in public/:\n${missing
        .map((m) => `  ${m.source} → ${m.value}`)
        .join('\n')}`,
    ).toEqual([]);
  });
});
