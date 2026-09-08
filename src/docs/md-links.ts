/**
 * md-links.ts — every relative link in a tracked markdown file points at something
 * that exists.
 *
 * THE BUG CLASS. This is guard d (asset-existence) applied to prose: a documented path
 * and a real path drifting apart with nothing to notice. It is not hypothetical here —
 * the §B audit found `docs/process/FUTURE_PROJECTS.md` linking `../ARCHITECTURE.md` and
 * `./TAILWIND_V4.md`, neither of which has ever existed in this repo (they are the
 * French LO project's docs), and README/CONTRIBUTING carried pointers to DESIGNER.md,
 * STRUCTURE.md and AGENTS.md for months before those files were written.
 *
 * NOTHING CAUGHT ANY OF IT. Prettier formats markdown, so `format:check` proves a doc is
 * SHAPED right and says nothing about whether it is TRUE. The eight guards all read
 * `.ts`/`.tsx`/`.css`/JSON. Before this file, exactly one markdown file was
 * machine-checked at all — STRUCTURE.md, and only the fenced block `docs-tree` writes.
 * The whole suite, lint, format and build stayed green through every broken link above.
 *
 * SCOPE IS DELIBERATELY NARROW: does the target EXIST. Three things are out of scope,
 * each for a stated reason rather than by omission — see the survey below.
 *
 * NOT IN src/guards/, for the same reason as docs-tree: that glob IS `bun run guards`,
 * and that command means "the eight spec guards (a–h)". A docs check is not one of them.
 * It runs in `bun run test`, which is the gate and what CI runs.
 *
 * ── THE SURVEY (42 relative · 17 http · 4 relative+anchor · 1 anchor-only; zero images,
 * zero root-absolute, zero reference-style definitions, zero links inside code fences) ──
 *
 * INLINE CODE SPANS ARE **NOT** STRIPPED, AND THAT IS THE SURVEY'S BIGGEST FINDING.
 * The obvious hardening — ignore anything inside backticks — BREAKS THIS REPO. Its
 * dominant link style is [`CONTRIBUTING.md`](CONTRIBUTING.md): the link TEXT is a code
 * span, the target is not. A naive span-stripper matches from the closing backtick of
 * one link's text to the opening backtick of the next and eats the real links between
 * them. Roughly 40 of the 42 relative links are written that way, so span-stripping
 * would silently check almost nothing while appearing to pass. The residual risk — a
 * literal `[x](y.md)` quoted as code in prose — has zero sites today, and would fail
 * loudly and obviously rather than silently.
 *
 * FENCED BLOCKS **ARE** STRIPPED. Zero sites today, but a doc showing markdown by
 * example is a normal thing to write, and a fence is unambiguous (``` / ~~~ toggling)
 * so stripping it costs nothing and cannot mangle a real link.
 *
 * ROOT-ABSOLUTE TARGETS (`/index.html`) ARE SKIPPED. Zero sites today. When one appears
 * it will be a DEPLOYED-SITE path, not a repo path — `public/llms.txt` is full of them —
 * and resolving it against the repo root would flag a correct link. Ambiguous input is
 * skipped rather than guessed at.
 *
 * ANCHORS ARE NOT VALIDATED, only stripped before resolving the file. `#section`
 * fragments would need GitHub's heading-slug rules reimplemented — duplicate-heading
 * `-1` suffixes, code spans and emoji in headings, HTML anchors — and every mismatch
 * between that reimplementation and GitHub's is a FALSE POSITIVE on a correct link.
 * Guard f's lesson: a check that fires on correct work is a check someone switches off.
 * File existence catches the drift that actually happened; anchors can be added later
 * against real evidence that they drift.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, trackedFiles } from './docs-tree';

/** One link whose target could not be found on disk. */
export type BrokenLink = {
  readonly file: string;
  readonly line: number;
  readonly target: string;
};

/** Targets that are not repo paths, and so are never resolved against the filesystem. */
function isExternal(target: string): boolean {
  return (
    /^[a-z][a-z0-9+.-]*:/i.test(target) || // http:, https:, mailto:, any scheme
    target.startsWith('//') || // protocol-relative
    target.startsWith('#') || // same-document anchor
    target.startsWith('/') // deployed-site path — see header
  );
}

/**
 * Strip fenced code blocks, preserving line numbering so findings stay truthful.
 *
 * Blank-lines-out rather than removal: a reported line number that does not match the
 * file is worse than no report at all.
 */
function blankFences(markdown: string): readonly string[] {
  let fence: string | null = null;
  return markdown.split('\n').map((line) => {
    const opener = /^\s*(```+|~~~+)/.exec(line);
    if (fence === null && opener) {
      fence = opener[1].slice(0, 3);
      return '';
    }
    if (fence !== null) {
      if (opener && opener[1].startsWith(fence)) fence = null;
      return '';
    }
    return line;
  });
}

/**
 * Reduce a link target to the repo-relative path it points at, or `null` when it is not
 * a repo path at all.
 */
export function resolveTarget(rawTarget: string): string | null {
  // `<path>` is legal markdown for a target containing spaces.
  const unwrapped = rawTarget.trim().replace(/^<(.*)>$/, '$1');
  // `(path "Title")` — the optional title is not part of the path.
  const withoutTitle = unwrapped.replace(/\s+["'(].*$/, '').trim();
  // `file.md#anchor` — the anchor is not validated, only removed. See header.
  const withoutAnchor = withoutTitle.split('#')[0] ?? '';

  if (withoutAnchor === '' || isExternal(withoutAnchor)) return null;
  return decodeURIComponent(withoutAnchor);
}

/** Every link in one markdown file whose target does not exist on disk. */
export function findBrokenLinks(markdown: string, file: string): readonly BrokenLink[] {
  const dir = path.dirname(path.join(REPO_ROOT, file));
  const broken: BrokenLink[] = [];

  blankFences(markdown).forEach((line, index) => {
    // Images (`![alt](x)`) count too: a missing image is the same bug as a missing doc.
    for (const match of line.matchAll(/!?\[[^\]]*\]\(([^)]*)\)/g)) {
      const target = resolveTarget(match[1] ?? '');
      if (target === null) continue;
      if (!existsSync(path.resolve(dir, target))) {
        broken.push({ file, line: index + 1, target });
      }
    }
  });

  return broken;
}

/** Every tracked `.md` file, from git's index — same source of truth as docs-tree. */
export function trackedMarkdown(): readonly string[] {
  return trackedFiles().filter((file) => file.endsWith('.md'));
}
