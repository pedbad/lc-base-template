/**
 * docs-tree.ts — generates the folder tree committed in STRUCTURE.md (buildlist 30,
 * spec §14).
 *
 * THE BUG CLASS. A hand-written folder tree starts lying the moment someone adds a
 * folder, and nothing tells anyone. That is guard d's lesson — a documented path and a
 * real path drifting apart silently — applied to documentation instead of code.
 *
 * BUT A GENERATOR NOBODY RUNS IS EXACTLY AS STALE AS A HAND-WRITTEN TREE. Generating
 * the tree solves nothing on its own; it only moves the staleness from "someone forgot
 * to edit the doc" to "someone forgot to run the script". So the real question this
 * file answers is not how to print a tree, it is HOW THE COMMITTED TREE IS KEPT HONEST.
 *
 * THREE OPTIONS WERE ON THE TABLE, AND THIS TAKES THE FIRST:
 *
 *   1. A TEST that regenerates the tree and asserts it matches what STRUCTURE.md
 *      commits. CHOSEN. It fails loudly in CI, in the same shape as the eight guards,
 *      and `bun run test` is what CI already runs — so it needs no new CI step and
 *      cannot be skipped. This repo already trusts exactly this pattern eight times.
 *   2. A pre-commit step in lint-staged.config.mjs. Rejected: it is bypassable with
 *      `--no-verify`, and it would silently REWRITE a file the author did not stage,
 *      which is a surprising thing for a formatter hook to do.
 *   3. Generation on demand, accepting staleness. Rejected: that is the hand-written
 *      tree again, with extra steps.
 *
 * WHERE THE TEST LIVES, AND WHY NOT `src/guards/`. `docs-tree.test.ts` sits beside this
 * file. It is deliberately NOT in src/guards/: that glob is `bun run guards`, and that
 * command means "the eight spec guards (a–h)". A docs-freshness check is not one of
 * them, and filing it there would make `bun run guards` report a count that no longer
 * matches the thing it claims to run. It still runs in `bun run test`, which is the
 * gate that matters.
 *
 * WHY THIS LOGIC IS HERE AND NOT IN scripts/. Vitest only collects
 * `src/**\/*.test.{ts,tsx}` (vite.config.ts), so a test next to a script in `scripts/`
 * would never run — the freshness check would be dead on arrival. Same split as
 * `src/build/prerender-html.ts` + `scripts/prerender.tsx`: the logic is here and
 * testable, `scripts/docs-tree.ts` is the thin CLI that writes the file.
 *
 * THE SOURCE OF TRUTH IS `git ls-files`, NOT readdir + an ignore list. A hand-kept skip
 * list (node_modules, dist, graphify-out, .understand-anything, .claude/tdd-guard, …)
 * is a second copy of .gitignore, free to drift from it — guard e's
 * convention-over-map argument. Tracked files are the definition of "in the repo", so
 * the tree documents what is actually committed, and a new git-ignored tool cache never
 * shows up. It reads the INDEX, so a staged-but-uncommitted new folder is already
 * visible to the check.
 *
 * CONTENT FOLDERS ARE COLLAPSED, ON PURPOSE. `lo-config/` and the media directories
 * hold COURSE CONTENT, not machinery. Expanding them would mean every content PR — the
 * green path CONTRIBUTING deliberately keeps frictionless — also had to regenerate this
 * tree, or fail CI. Their internal shape is documented in prose in STRUCTURE.md, where
 * it belongs, and is enforced by guard b. So they render as a single collapsed node.
 *
 * THE TREE IS UNANNOTATED. Descriptions live in the hand-written prose above it (spec
 * §14: "tree auto-generated above a hand-written 'where things go' block"). A generated
 * annotation would need a hand-kept path→description map, which this test could not
 * check for staleness — it would catch a MISSING folder but never a WRONG description.
 * Better to have no second surface than a surface nothing verifies.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';

/** Repo root, resolved from this file so the cwd is irrelevant. */
export const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

export const STRUCTURE_PATH = path.join(REPO_ROOT, 'STRUCTURE.md');

/** The markers in STRUCTURE.md that the generated block is written between. */
export const TREE_START = '<!-- docs:tree:start -->';
export const TREE_END = '<!-- docs:tree:end -->';

/**
 * Directories rendered as one node instead of being walked.
 *
 * These hold authored CONTENT, whose shape is prose in STRUCTURE.md and enforced by
 * guard b. Listing them would make every content addition a STRUCTURE.md edit.
 */
export const COLLAPSED_DIRS: readonly string[] = [
  'lo-config',
  'public/audio',
  'public/fonts',
  'public/images',
];

/** Suffix marking a collapsed node, so a reader knows the tree stopped on purpose. */
const COLLAPSED_MARK = '…';

/**
 * Every directory implied by a list of repo-relative file paths, as a sorted set.
 *
 * A path contributes each of its ancestors: `src/lo/blocks/x.ts` yields `src`,
 * `src/lo` and `src/lo/blocks`. A root-level file (`README.md`) yields nothing —
 * the tree lists folders, not files.
 */
export function directoriesOf(files: readonly string[]): readonly string[] {
  const dirs = new Set<string>();
  for (const file of files) {
    const segments = file.split('/');
    // Stop one short: the last segment is the filename.
    for (let i = 1; i < segments.length; i += 1) {
      dirs.add(segments.slice(0, i).join('/'));
    }
  }
  return [...dirs].sort();
}

/** True when `dir` sits strictly BELOW a collapsed directory (so it is not rendered). */
function isInsideCollapsed(dir: string): boolean {
  return COLLAPSED_DIRS.some((collapsed) => dir.startsWith(`${collapsed}/`));
}

/** A directory and its rendered children, built from the flat sorted path list. */
type TreeNode = { readonly name: string; readonly collapsed: boolean; children: TreeNode[] };

/**
 * Nest the flat, sorted directory list into a real tree.
 *
 * Sorted input guarantees a parent is seen before its children, so no second pass or
 * lookup-by-path is needed beyond the running index.
 */
function nest(dirs: readonly string[]): TreeNode[] {
  const roots: TreeNode[] = [];
  const byPath = new Map<string, TreeNode>();

  for (const dir of dirs) {
    if (isInsideCollapsed(dir)) continue;

    const cut = dir.lastIndexOf('/');
    const node: TreeNode = {
      name: cut === -1 ? dir : dir.slice(cut + 1),
      collapsed: COLLAPSED_DIRS.includes(dir),
      children: [],
    };
    byPath.set(dir, node);

    if (cut === -1) {
      roots.push(node);
    } else {
      // A parent is always present: `directoriesOf` emits every ancestor.
      byPath.get(dir.slice(0, cut))?.children.push(node);
    }
  }

  return roots;
}

/** Recursively draw `nodes`, with `prefix` holding the ancestor spine columns. */
function draw(nodes: readonly TreeNode[], prefix: string): string[] {
  return nodes.flatMap((node, index) => {
    const isLast = index === nodes.length - 1;
    const label = `${node.name}/${node.collapsed ? COLLAPSED_MARK : ''}`;
    return [
      `${prefix}${isLast ? '└── ' : '├── '}${label}`,
      ...draw(node.children, `${prefix}${isLast ? '    ' : '│   '}`),
    ];
  });
}

/**
 * Render the directory list as a box-drawing tree.
 *
 * Deterministic: input is sorted, so the same repo always produces byte-identical
 * output — which is what makes the freshness assertion meaningful rather than flaky.
 */
export function renderTree(dirs: readonly string[]): string {
  return ['.', ...draw(nest(dirs), '')].join('\n');
}

/**
 * Replace the block between the two markers in `markdown` with `tree`.
 *
 * Throws — rather than appending, or silently returning the input — when a marker is
 * missing or out of order. A generator that quietly writes nothing is the failure mode
 * this whole file exists to prevent.
 */
export function spliceTree(markdown: string, tree: string): string {
  const start = markdown.indexOf(TREE_START);
  const end = markdown.indexOf(TREE_END);

  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `STRUCTURE.md must contain ${TREE_START} then ${TREE_END}; found start=${start}, end=${end}`,
    );
  }

  const before = markdown.slice(0, start + TREE_START.length);
  const after = markdown.slice(end);
  return `${before}\n\n\`\`\`text\n${tree}\n\`\`\`\n\n${after}`;
}

/**
 * Repo-relative paths of every tracked file, from git's index.
 *
 * Throws loudly if git is unavailable: emitting a tree built from a partial file list
 * would be worse than failing, because it would look correct.
 */
export function trackedFiles(): readonly string[] {
  const stdout = execFileSync('git', ['ls-files', '-z'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout.split('\0').filter((line) => line.length > 0);
}

/** The tree this repo should currently be documenting. */
export function currentTree(): string {
  return renderTree(directoriesOf(trackedFiles()));
}
