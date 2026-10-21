/**
 * file-names.test.ts — every file and folder in `src/` is named in one of the repo's
 * shapes (docs/STYLE.md, "Files and names"), so a camelCase module cannot creep back in.
 *
 * NOT IN src/guards/ ON PURPOSE, like docs-tree.test.ts: `bun run guards` means "the
 * eight spec guards (a–h)", and a naming convention is not one of them. It runs in
 * `bun run test`, so CI and the pre-push hook enforce it all the same.
 */
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { findMisnamed, nameShape } from './file-names';

const SRC = path.resolve(import.meta.dirname, '..');

describe('nameShape', () => {
  it.each([
    ['flip-cue-store.ts', 'kebab'],
    ['progress-meter.css', 'kebab'],
    ['main.tsx', 'kebab'],
    ['useFlipCue.ts', 'hook'],
    ['ProgressMeter.tsx', 'pascal'],
    ['AudioManager.ts', 'pascal'],
  ])('reads %s as %s', (file, shape) => {
    expect(nameShape(file)).toBe(shape);
  });

  // A dot qualifier after the name is part of the shape, not a break in it.
  it.each([
    'course.config.ts',
    'flip-cue-store.test.ts',
    'ExerciseHost.progress.test.tsx',
    'sandbox-docs.d.ts',
    'reading.fixture.ts',
  ])('accepts the qualified name %s', (file) => {
    expect(nameShape(file)).not.toBeNull();
  });

  it.each(['charDiff.ts', 'prefersReducedMotion.test.ts', 'snake_case.ts', 'Bad.Qualifier.ts'])(
    'rejects %s',
    (file) => {
      expect(nameShape(file)).toBeNull();
    },
  );

  it('reads a folder name as kebab only', () => {
    expect(nameShape('ui-showcase')).toBe('kebab');
    expect(nameShape('richText')).toBeNull();
  });
});

describe('findMisnamed', () => {
  // Each path is judged by its own last segment; a folder is listed as its own entry.
  it('lists the paths whose own name breaks the shapes, folders included', () => {
    expect(
      findMisnamed(['lib/charDiff.ts', 'lib/char-diff.ts', 'richText/', 'Hooks/', 'Hooks/useX.ts']),
    ).toEqual(['lib/charDiff.ts', 'richText/', 'Hooks/']);
  });
});

/** Every file and folder under `src/`, relative to it; folders end in `/`. */
function srcEntries(): string[] {
  return readdirSync(SRC, { recursive: true, encoding: 'utf-8' })
    .filter((entry) => !entry.startsWith(path.join('components', 'ui')))
    .map((entry) => (statSync(path.join(SRC, entry)).isDirectory() ? `${entry}/` : entry))
    .map((entry) => entry.split(path.sep).join('/'));
}

describe('src/ follows the naming shapes', () => {
  // src/components/ui/ is vendored shadcn, named by the shadcn CLI, so it is left out.
  it('has no file or folder named outside them', () => {
    expect(findMisnamed(srcEntries())).toEqual([]);
  });
});
