/**
 * layer-discipline.ts — guard g: every rule sits in a layer, nothing uses `!important`
 * (buildlist 25, spec §5).
 *
 * THE BUG CLASS. Guard f protects the token chain's VALUES; guard g protects the chain's
 * ability to be overridden at all. Both of the structures banned here win the cascade
 * unconditionally — not by being more specific, but by sitting outside the ordering the
 * layers establish:
 *
 *   - An UNLAYERED rule beats every layered rule, whatever their specificity. Tailwind
 *     v4 puts its utilities in a layer, and every stylesheet here puts its rules in
 *     `@layer base` or `@layer components` precisely so that a utility can still win
 *     where it should. One bare `.card { padding: 0 }` at the top level of a file
 *     silently outranks the whole system, and no amount of specificity downstream can
 *     take it back.
 *   - `!important` does the same at declaration level, and inverts layer order on top:
 *     inside a layer, an important declaration in the FIRST layer beats one in the last.
 *     A single `!important` therefore makes the layer order mean the opposite of what it
 *     reads as.
 *
 * WHAT THIS GUARDS. Again nothing today, and again that is the point (TODO §A-g). There
 * are zero real `!important`s and — this is what the survey could NOT verify and what
 * this guard establishes — zero unlayered rules.
 *
 * WHY "THE FILE CONTAINS @layer" IS NOT THE CHECK. Every one of the 15 stylesheets
 * contains at least one `@layer`, which is easy to grep and proves nothing: a file can
 * open with a layer block, close it, and carry on with bare rules underneath. The rule
 * has to be about each RULE's position, not the file's contents, so guard g tracks brace
 * depth and the at-rule enclosing each block (`css-source.ts` does the reading).
 *
 * FOUR STRUCTURES A NAIVE DEPTH COUNTER GETS WRONG, each decided here:
 *
 *   1. STATEMENT AT-RULES ARE FINE OUTSIDE A LAYER. `@import` is REQUIRED to come first
 *      in a file, so index.css's five imports could not be layered even in principle;
 *      `@charset`, `@custom-variant` and a bare `@layer a, b;` ordering declaration have
 *      no block at all. None of them is a rule, so none is checked.
 *   2. DESCRIPTOR AT-RULES ARE FINE OUTSIDE A LAYER, and their inner blocks are not
 *      rules. `@font-face` and `@theme inline` are exactly what index.css holds at top
 *      level; they carry DESCRIPTORS, which do not cascade, so there is no layer for
 *      them to belong to. `@keyframes` is the trap: a `0% { … }` step has a percentage
 *      where a selector would go, and a depth counter reads it as an unlayered rule.
 *   3. `:root` CUSTOM-PROPERTY BLOCKS ARE ORDINARY RULES and ARE checked. Custom
 *      properties cascade by layer like anything else — an unlayered `:root` beats a
 *      layered one — so palette.css and all four token files wrapping their `:root` in
 *      `@layer base` is load-bearing, not habit. This is the case most likely to be
 *      waved through as "just variables"; it is not.
 *   4. `@media` IS TRANSPARENT TO THE CASCADE, so it must be looked THROUGH, in both
 *      directions. A `@media` nested inside a layer keeps its rules layered — that is
 *      how all nine `@media` blocks in the repo are written, and flagging them would
 *      flag correct code. A top-level `@media` layers nothing, so a rule inside it is
 *      just as unlayered as a bare one. Same for `@supports` and `@container`.
 *
 * COMMENTS ARE STRIPPED FIRST, and here it is the whole `!important` half: all six
 * matches in the repo sit in the file headers of the exercise engines, each PROMISING
 * "no raw hex, no `!important`". Without stripping, guard g flags the six comments that
 * document guard g. Third guard in a row to turn on this (c, f, now g).
 *
 * SCOPE IS CSS ONLY. Tailwind's trailing-`!` important modifier appears in
 * `src/components/ui/` (e.g. `top-1/2!` in `tooltip.tsx`), but that is generated shadcn
 * expressing utility precedence within Tailwind's own layer — not a rule escaping the
 * layer system — and guard f already documents why regenerated code cannot be held to
 * these rules. Extending guard g to markup would buy an exemption and no signal.
 */
import { DESCRIPTOR_AT_RULES, parseCss, type StyleViolation } from './css-source';

/** `!important`, however it is spaced or cased. */
const IMPORTANT_PATTERN = /!\s*important\b/i;

/** What one stylesheet contained, so a sweep can assert it saw what it expects to see. */
export interface LayerAudit {
  readonly violations: readonly StyleViolation[];
  /** `@layer` blocks found — the thing a rename or a moved directory would empty. */
  readonly layerBlocks: number;
  /** Selector rules found, layered or not. */
  readonly selectorRules: number;
}

/**
 * Every rule in one stylesheet that escapes the layer system, plus the totals a
 * staleness floor can assert on.
 *
 * @param css Stylesheet text.
 * @param file Label used in the violation, normally a repo-relative path.
 */
export function auditLayerDiscipline(css: string, file = '<stylesheet>'): LayerAudit {
  const violations: StyleViolation[] = [];
  const { blocks, declarations } = parseCss(css);
  let layerBlocks = 0;
  let selectorRules = 0;

  for (const block of blocks) {
    if (block.atRule === 'layer') layerBlocks += 1;
    // An at-rule block is never itself a cascading rule, so only selector lists are
    // judged — and a selector list sitting inside a descriptor at-rule (a @keyframes
    // step, most of all) is not a rule either.
    if (block.atRule !== '') continue;
    if (block.atRules.some((name) => (DESCRIPTOR_AT_RULES as readonly string[]).includes(name))) {
      continue;
    }

    selectorRules += 1;
    if (block.atRules.includes('layer')) continue;
    violations.push({
      file,
      line: block.line,
      rule: 'unlayered-rule',
      detail: `${block.prelude} { … } — wrap it in @layer base or @layer components`,
    });
  }

  for (const { property, value, line } of declarations) {
    if (!IMPORTANT_PATTERN.test(value)) continue;
    violations.push({
      file,
      line,
      rule: 'important',
      detail: `${property}: ${value} — fix the layer order instead`,
    });
  }

  return { violations, layerBlocks, selectorRules };
}

/** Guard g's layer half, for the reading a unit test and a sweep message want. */
export function findUnlayeredRules(css: string, file?: string): StyleViolation[] {
  return auditLayerDiscipline(css, file).violations.filter((v) => v.rule === 'unlayered-rule');
}

/** Guard g's `!important` half. */
export function findImportantDeclarations(css: string, file?: string): StyleViolation[] {
  return auditLayerDiscipline(css, file).violations.filter((v) => v.rule === 'important');
}
