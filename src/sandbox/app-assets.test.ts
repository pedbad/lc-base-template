/**
 * app-assets.test.ts — the debug sandbox shows EVERY icon and image the app uses
 * (maintainer, 2026-10-08: lucide icons added for flashcards and vocabulary never
 * reached the Icons section). Both lists are scanned from the source, so a new icon or
 * image fails here until it is added to `app-assets.ts` and shows on the sandbox.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { APP_ICONS, APP_IMAGES } from './app-assets';

const ROOT = path.resolve(import.meta.dirname, '../..');
const SRC = path.join(ROOT, 'src');
const PUBLIC = path.join(ROOT, 'public');

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

/** Every name imported from lucide-react anywhere in src/, tests and this list aside. */
function lucideImports(): string[] {
  const names = new Set<string>();
  const files = walk(SRC).filter(
    (file) =>
      /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file) && !file.endsWith('app-assets.ts'),
  );
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*'lucide-react'/g)) {
      for (const raw of match[1]?.split(',') ?? []) {
        const name = raw
          .replace(/^\s*type\s+/, '')
          .split(/\s+as\s+/)[0]
          ?.trim();
        if (name) names.add(name);
      }
    }
  }
  return [...names].sort();
}

/** Every image under public/images, plus the two root marks; the sprite has its own section. */
function publicImages(): string[] {
  const images = walk(path.join(PUBLIC, 'images'))
    .filter((file) => /\.(svg|png|webp|jpe?g|avif|gif)$/i.test(file))
    .map((file) => path.relative(PUBLIC, file).split(path.sep).join('/'));
  return [...images, 'favicon.svg', 'logo.svg'].sort();
}

describe('the sandbox lists every asset the app uses', () => {
  test('every lucide icon imported in src/', () => {
    expect(Object.keys(APP_ICONS).sort()).toEqual(lucideImports());
  });

  test('every image under public/', () => {
    expect([...APP_IMAGES].sort()).toEqual(publicImages());
  });
});
