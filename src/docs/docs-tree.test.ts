/**
 * docs-tree.test.ts — the freshness check that makes the generated tree worth having,
 * plus unit tests for the pure parts (buildlist 30).
 *
 * NOT IN src/guards/ ON PURPOSE. `bun run guards` means "the eight spec guards (a–h)";
 * a docs-freshness check is not one of them, and filing it there would make that
 * command's name a half-truth. It runs in `bun run test`, which is what CI runs and
 * what the verify gate requires — see the header of `docs-tree.ts` for the full
 * argument, including why a test beats a pre-commit hook here.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  STRUCTURE_PATH,
  TREE_END,
  TREE_START,
  currentTree,
  directoriesOf,
  renderTree,
  spliceTree,
} from './docs-tree';

describe('directoriesOf', () => {
  it('yields every ancestor of a nested file, and nothing for a root file', () => {
    expect(directoriesOf(['src/lo/blocks/x.ts', 'README.md'])).toEqual([
      'src',
      'src/lo',
      'src/lo/blocks',
    ]);
  });

  it('de-duplicates directories shared by many files', () => {
    expect(directoriesOf(['a/one.ts', 'a/two.ts', 'a/b/three.ts'])).toEqual(['a', 'a/b']);
  });
});

describe('renderTree', () => {
  it('draws nesting with the last child closing its branch', () => {
    expect(renderTree(['a', 'a/b', 'c'])).toBe(['.', '├── a/', '│   └── b/', '└── c/'].join('\n'));
  });

  it('collapses content directories instead of walking them', () => {
    // lo-config/ is COLLAPSED_DIRS: a content PR must not have to regenerate this file.
    const tree = renderTree([
      'lo-config',
      'lo-config/lo-00-example',
      'lo-config/lo-00-example/blocks',
    ]);
    expect(tree).toBe(['.', '└── lo-config/…'].join('\n'));
  });
});

describe('spliceTree', () => {
  it('replaces the block between the markers and leaves the rest untouched', () => {
    const before = `# Doc\n\nprose\n\n${TREE_START}\nSTALE\n${TREE_END}\n\ntail\n`;
    const after = spliceTree(before, '.\n└── src/');

    expect(after).toContain('prose');
    expect(after).toContain('tail');
    expect(after).not.toContain('STALE');
    expect(after).toContain('```text\n.\n└── src/\n```');
  });

  it('is idempotent — splicing the same tree twice changes nothing', () => {
    const once = spliceTree(`${TREE_START}\n${TREE_END}`, '.\n└── src/');
    expect(spliceTree(once, '.\n└── src/')).toBe(once);
  });

  // A generator that quietly writes nothing is the exact failure mode this file
  // exists to prevent, so a missing or reversed marker pair must throw, not no-op.
  it('throws when a marker is missing or out of order', () => {
    expect(() => spliceTree('# Doc\nno markers\n', '.')).toThrow(/must contain/);
    expect(() => spliceTree(`${TREE_END}\n${TREE_START}`, '.')).toThrow(/must contain/);
  });
});

describe('STRUCTURE.md is not stale', () => {
  it('commits the tree the repo actually has', () => {
    const committed = readFileSync(STRUCTURE_PATH, 'utf8');
    expect(
      committed,
      'STRUCTURE.md is out of date — a folder was added or removed. Run `bun run docs:tree` and commit the result.',
    ).toBe(spliceTree(committed, currentTree()));
  });
});
