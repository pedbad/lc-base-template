/**
 * md-links.test.ts — proves the link check catches real drift without firing on the
 * link styles this repo actually uses.
 *
 * The second half is the expensive one, as it was for guards f, g and h: the repo was
 * already clean when this landed, so the work is NOT FLAGGING CORRECT DOCS. Each
 * `passes` case below is a shape that exists in the repo today and that a first-guess
 * rule gets wrong.
 *
 * Not in src/guards/ — see the header of `md-links.ts`.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from './docs-tree';
import { findBrokenLinks, resolveTarget, trackedMarkdown } from './md-links';

const at = (markdown: string) => findBrokenLinks(markdown, 'README.md');

describe('findBrokenLinks catches drift', () => {
  it('flags a relative target that does not exist, with a truthful line number', () => {
    const found = at('# Doc\n\nsee [gone](./nope.md) here\n');
    expect(found).toHaveLength(1);
    expect(found[0]?.target).toBe('./nope.md');
    expect(found[0]?.line).toBe(3);
  });

  it('flags a missing image, which is the same bug as a missing doc', () => {
    expect(at('![chart](images/nope.png)')).toHaveLength(1);
  });

  it('flags a missing file even when an anchor is attached', () => {
    expect(at('[x](./nope.md#some-heading)')).toHaveLength(1);
  });

  it('resolves relative to the linking file, not the repo root', () => {
    // ../DESIGNER.md is correct FROM src/styles/, and wrong from the root.
    expect(findBrokenLinks('[d](../../DESIGNER.md)', 'src/styles/README.md')).toEqual([]);
    expect(findBrokenLinks('[d](../../DESIGNER.md)', 'README.md')).toHaveLength(1);
  });
});

describe('findBrokenLinks does not flag correct docs', () => {
  it('passes the backticked-text style this repo uses everywhere', () => {
    // [`CONTRIBUTING.md`](CONTRIBUTING.md) — the TEXT is a code span, the target is not.
    // Stripping inline code spans would eat these; ~40 of 42 links are written this way.
    expect(at('see [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`AGENTS.md`](AGENTS.md)')).toEqual([]);
  });

  it('passes external and same-document targets', () => {
    expect(at('[a](https://bun.sh) [b](mailto:x@y.z) [c](#a-heading) [d](//cdn.example)')).toEqual(
      [],
    );
  });

  it('passes a root-absolute target, which is a deployed-site path not a repo path', () => {
    expect(at('[home](/index.html)')).toEqual([]);
  });

  it('passes a link to a directory', () => {
    expect(at('[styles](src/styles)')).toEqual([]);
  });

  it('ignores links inside fenced code blocks, and keeps later line numbers truthful', () => {
    const found = at(
      ['# Doc', '', '```md', '[x](./nope.md)', '```', '', '[y](./gone.md)'].join('\n'),
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.line).toBe(7);
  });
});

describe('resolveTarget', () => {
  it('unwraps angle brackets and drops an optional title', () => {
    expect(resolveTarget('<a b.md>')).toBe('a b.md');
    expect(resolveTarget('a.md "Title"')).toBe('a.md');
  });

  it('decodes percent-escapes so an encoded path resolves', () => {
    expect(resolveTarget('a%20b.md')).toBe('a b.md');
  });

  it('returns null for anything that is not a repo path', () => {
    for (const t of ['https://x.dev', 'mailto:a@b.c', '#top', '/index.html', '']) {
      expect(resolveTarget(t), t).toBeNull();
    }
  });
});

describe('every tracked markdown file', () => {
  it('links only to things that exist', () => {
    const broken = trackedMarkdown().flatMap((file) =>
      findBrokenLinks(readFileSync(path.join(REPO_ROOT, file), 'utf8'), file),
    );
    expect(
      broken.map((b) => `${b.file}:${b.line} → ${b.target}`),
      'a markdown link points at a path that does not exist',
    ).toEqual([]);
  });
});
