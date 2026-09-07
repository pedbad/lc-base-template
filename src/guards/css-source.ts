/**
 * css-source.ts — the stylesheet reader shared by guards f and g
 * (buildlist 24, 25, spec §136–138 and §5).
 *
 * WHY IT EXISTS. Guards f (token integrity) and g (layer discipline) ask different
 * questions of the SAME 15 stylesheets, need the same comment stripping, and report the
 * same `file:line` shape. Two copies of that reading would be two chances for the two
 * guards to disagree about what a declaration is — so it is written once, here, and each
 * guard contributes only its rule.
 *
 * WHY IT PARSES RATHER THAN GREPS. Guard c could pattern-match a line, because a URL sink
 * is recognisable on its own. Neither f nor g is: `4px` is legal or illegal depending on
 * the PROPERTY it sets, and a selector rule is legal or illegal depending on whether an
 * `@layer` encloses it. Both questions are about a value's POSITION in the tree, so the
 * reader has to know where it is. It is still not a real CSS parser — it tracks braces,
 * strings and at-rule names, which is exactly and only what the two rules need.
 *
 * COMMENTS ARE STRIPPED FIRST, and for these two guards that is not a nicety — it is the
 * difference between a working guard and one that gets switched off on day one. Without
 * it, f flags the four brand hexes that `tokens-variant-a/b/c.css` name in their file
 * headers, and g flags the six engine stylesheets whose headers promise "no raw hex, no
 * `!important`". Every current match for both rules is a comment. That is the third guard
 * in a row (c, f, g) whose correctness turns on this, so the stripper is REUSED from
 * guard c rather than rewritten: `stripComments()` there is string-aware and
 * offset-preserving, so line numbers stay truthful.
 *
 * CSS IS A DIFFERENT DIALECT, though, and the difference bites. CSS has no `//` comment.
 * Guard c's stripper honours one, which would blank the tail of any line holding an
 * unquoted `url(https://…)` — silently blinding both guards to everything after it. So
 * the CSS entry point passes `lineComments: false`. Today every `url()` in the repo is
 * quoted and the only `//` sits inside a block comment, so nothing is currently at
 * stake; the flag is there so nothing is at stake later either.
 */
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { lineAt, stripComments } from './asset-path';

/** Directory names never worth walking. */
const SKIPPED_DIRS = ['node_modules', 'dist', '.git'] as const;

/**
 * At-rules that are TRANSPARENT to the cascade: the rules inside them cascade as if
 * written where the at-rule sits. That is why guard g must look through them — a
 * `@media` block at the top level holds rules that are just as unlayered as a bare one.
 */
export const TRANSPARENT_AT_RULES = ['media', 'supports', 'container', 'scope'] as const;

/**
 * At-rules whose inner blocks are NOT selector rules, whatever they look like. A
 * `@keyframes` step (`0% { … }`) has a percentage where a selector would go, and
 * `@font-face` / `@property` / `@theme` hold descriptors. None of them participates in
 * the cascade as a rule, so guard g must not read them as unlayered ones.
 */
export const DESCRIPTOR_AT_RULES = ['keyframes', 'font-face', 'property', 'theme'] as const;

/** One violation from either CSS guard, located well enough to fix without searching. */
export interface StyleViolation {
  readonly file: string;
  readonly line: number;
  /** Which rule fired, e.g. `raw-px`, `unlayered-rule`. */
  readonly rule: string;
  /** The offending text, trimmed to something readable in a failure message. */
  readonly detail: string;
}

/** One `property: value` pair, plus enough context to judge whether it is allowed. */
export interface CssDeclaration {
  readonly property: string;
  readonly value: string;
  readonly line: number;
  /** Enclosing at-rule names without the `@`, outermost first, e.g. `['layer','media']`. */
  readonly atRules: readonly string[];
}

/** One `{ … }` block, keyed by what stood before the brace. */
export interface CssBlock {
  /** The text before `{`, whitespace-collapsed: a selector list or an at-rule prelude. */
  readonly prelude: string;
  readonly line: number;
  /** At-rule name without `@`, or `''` when the block is a plain selector rule. */
  readonly atRule: string;
  /** Enclosing at-rule names, outermost first — the block's own is not included. */
  readonly atRules: readonly string[];
}

/** Everything either guard needs from one stylesheet, read in a single pass. */
export interface CssTree {
  readonly declarations: readonly CssDeclaration[];
  readonly blocks: readonly CssBlock[];
}

/** Blank out CSS comments, preserving offsets. See the header on `lineComments`. */
export function stripCssComments(source: string): string {
  return stripComments(source, { lineComments: false });
}

/** At-rule name of a prelude (`@media (…)` → `media`), or `''` for a selector list. */
function atRuleNameOf(prelude: string): string {
  return /^@([a-zA-Z-]+)/.exec(prelude)?.[1]?.toLowerCase() ?? '';
}

/**
 * Read one stylesheet into the declarations and blocks it contains.
 *
 * Comments are stripped by the caller's entry point, not here, so a caller holding
 * already-stripped text does not pay for it twice.
 *
 * @param css Stylesheet text with comments already blanked.
 */
function walk(css: string): CssTree {
  const declarations: CssDeclaration[] = [];
  const blocks: CssBlock[] = [];
  /** At-rule name per open block — `''` for a selector rule — outermost first. */
  const stack: string[] = [];
  let pending = '';
  let index = 0;
  let quote = '';

  const flushDeclaration = (endedAt: number): void => {
    const text = pending.trim();
    pending = '';
    const split = text.indexOf(':');
    if (split <= 0) return;
    const property = text.slice(0, split).trim();
    const value = text.slice(split + 1).trim();
    if (property === '' || value === '') return;
    declarations.push({
      property,
      value,
      line: lineAt(css, endedAt),
      atRules: stack.filter((name) => name !== ''),
    });
  };

  while (index < css.length) {
    const char = css[index] ?? '';

    if (quote) {
      pending += char;
      if (char === '\\') {
        pending += css[index + 1] ?? '';
        index += 2;
        continue;
      }
      if (char === quote) quote = '';
      index += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      pending += char;
      index += 1;
      continue;
    }
    if (char === '{') {
      const prelude = pending.trim().replace(/\s+/g, ' ');
      pending = '';
      const atRule = atRuleNameOf(prelude);
      blocks.push({
        prelude,
        line: lineAt(css, index),
        atRule,
        atRules: stack.filter((name) => name !== ''),
      });
      stack.push(atRule);
      index += 1;
      continue;
    }
    if (char === '}') {
      flushDeclaration(index);
      stack.pop();
      index += 1;
      continue;
    }
    if (char === ';') {
      // A `;` at block level ends a declaration; at file level it ends a statement
      // at-rule (`@import '…';`, `@layer a, b;`), which has no property to record.
      if (stack.length > 0) flushDeclaration(index);
      else pending = '';
      index += 1;
      continue;
    }
    pending += char;
    index += 1;
  }

  return { declarations, blocks };
}

/** Read a stylesheet, stripping comments first. */
export function parseCss(css: string): CssTree {
  return walk(stripCssComments(css));
}

/** Every `.css` file under `src/` — the whole token chain plus every component sheet. */
export function guardedStyleSheets(repoRoot: string): string[] {
  const found: string[] = [];

  const step = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!(SKIPPED_DIRS as readonly string[]).includes(entry.name)) {
          step(path.join(dir, entry.name));
        }
        continue;
      }
      if (entry.name.endsWith('.css')) found.push(path.join(dir, entry.name));
    }
  };

  step(path.join(repoRoot, 'src'));
  return found.sort();
}

export { lineAt };
