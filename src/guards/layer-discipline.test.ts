/**
 * layer-discipline.test.ts — guard g (buildlist 25).
 *
 * The `!important` half is trivial once comments are stripped — all six matches in the
 * repo are file headers PROMISING not to use it. The `@layer` half is the real work and
 * the part the survey could not verify, so the cases below are mostly the structures a
 * naive brace counter gets wrong: `@import` at the top of a file, a `:root` custom
 * property block, an `@media` nested inside a layer versus one outside it, `@font-face`
 * and `@keyframes` whose inner blocks only LOOK like selector rules, and nested layers.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { guardedStyleSheets } from './css-source';
import {
  auditLayerDiscipline,
  findImportantDeclarations,
  findUnlayeredRules,
} from './layer-discipline';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

describe('findUnlayeredRules — catches a rule that escapes the cascade', () => {
  it('flags a bare selector rule at the top level', () => {
    const found = findUnlayeredRules('.thing {\n  color: red;\n}');
    expect(found).toHaveLength(1);
    expect(found[0]?.rule).toBe('unlayered-rule');
    expect(found[0]?.detail).toContain('.thing');
  });

  // An unlayered rule beats EVERY layered one regardless of specificity, so this is not
  // a tidiness rule — it is the one structure that cannot be overridden downstream.
  it('flags a rule that sits after a layer block rather than inside it', () => {
    const found = findUnlayeredRules(
      '@layer components {\n  .a {\n    color: red;\n  }\n}\n\n.b {\n  color: blue;\n}',
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.detail).toContain('.b');
    expect(found[0]?.line).toBe(7);
  });

  // @media is TRANSPARENT to the cascade: the rules inside it cascade where the @media
  // sits. A top-level one is therefore just as unlayered as a bare rule.
  it('flags a rule inside a top-level @media, which layers nothing', () => {
    const found = findUnlayeredRules('@media (width >= 40rem) {\n  .a {\n    gap: 1rem;\n  }\n}');
    expect(found).toHaveLength(1);
    expect(found[0]?.detail).toContain('.a');
  });

  it('flags a rule inside a top-level @supports too', () => {
    expect(
      findUnlayeredRules('@supports (display: grid) {\n  .a {\n    display: grid;\n  }\n}'),
    ).toHaveLength(1);
  });

  // Custom properties DO cascade by layer — an unlayered :root beats a layered one — so
  // the token files putting every :root inside @layer base is load-bearing, not habit.
  it('flags an unlayered :root custom-property block', () => {
    expect(findUnlayeredRules(':root {\n  --border: #000;\n}')).toHaveLength(1);
  });

  it('reports where it found it, so the failure is actionable', () => {
    const found = findUnlayeredRules('\n\n.thing {\n  color: red;\n}', 'shell.css');
    expect(found[0]?.file).toBe('shell.css');
    expect(found[0]?.line).toBe(3);
  });
});

describe('findUnlayeredRules — leaves the compliant repo alone', () => {
  it('passes a rule inside a layer', () => {
    expect(findUnlayeredRules('@layer components {\n  .a {\n    color: red;\n  }\n}')).toEqual([]);
  });

  it('passes an @media nested INSIDE a layer, which every component sheet does', () => {
    const css =
      '@layer components {\n  @media (prefers-reduced-motion: reduce) {\n    .a {\n      transition: none;\n    }\n  }\n}';
    expect(findUnlayeredRules(css)).toEqual([]);
  });

  it('passes a nested @layer', () => {
    expect(
      findUnlayeredRules(
        '@layer components {\n  @layer inner {\n    .a {\n      color: red;\n    }\n  }\n}',
      ),
    ).toEqual([]);
  });

  // index.css opens with these and they are LEGAL outside a layer — @import is required
  // to come first, and the rest are statement at-rules with no block at all.
  it('passes the statement at-rules index.css opens with', () => {
    expect(findUnlayeredRules("@charset 'utf-8';")).toEqual([]);
    expect(findUnlayeredRules("@import 'tailwindcss';\n@import './styles/palette.css';")).toEqual(
      [],
    );
    expect(findUnlayeredRules('@custom-variant dark (&:is(.dark *));')).toEqual([]);
    expect(findUnlayeredRules('@layer base, components;')).toEqual([]);
  });

  // These carry DESCRIPTORS, not cascading declarations, so there is no layer for them
  // to sit in. `@font-face` and `@theme` are exactly what index.css holds at top level.
  it('passes descriptor at-rules outside a layer', () => {
    expect(
      findUnlayeredRules("@font-face {\n  font-family: Feijoa;\n  src: url('/a.otf');\n}"),
    ).toEqual([]);
    expect(findUnlayeredRules('@theme inline {\n  --color-border: var(--border);\n}')).toEqual([]);
    expect(findUnlayeredRules('@property --x {\n  syntax: "<length>";\n}')).toEqual([]);
  });

  // A @keyframes step has a percentage where a selector would go. A naive depth counter
  // reads `0% { … }` as an unlayered rule; it is not a rule at all.
  it('passes @keyframes steps, which only look like selector rules', () => {
    const css =
      '@keyframes radiate {\n  0% {\n    opacity: 1;\n  }\n  100% {\n    opacity: 0;\n  }\n}';
    expect(findUnlayeredRules(css)).toEqual([]);
  });

  it('passes a rule commented out, which styles nothing', () => {
    expect(findUnlayeredRules('/* .thing {\n  color: red;\n} */')).toEqual([]);
  });

  it('counts what it saw, so a rename cannot quietly empty the sweep', () => {
    const audit = auditLayerDiscipline('@layer components {\n  .a {\n    color: red;\n  }\n}');
    expect(audit.layerBlocks).toBe(1);
    expect(audit.selectorRules).toBe(1);
    expect(audit.violations).toEqual([]);
  });
});

describe('findImportantDeclarations — the cascade escape hatch', () => {
  it('flags an !important declaration', () => {
    const found = findImportantDeclarations(
      '@layer components {\n  .a {\n    color: red !important;\n  }\n}',
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.rule).toBe('important');
    expect(found[0]?.line).toBe(3);
  });

  it('flags it whatever the spacing', () => {
    expect(findImportantDeclarations('.a {\n  color: red!important;\n}')).toHaveLength(1);
    expect(findImportantDeclarations('.a {\n  color: red  !  important;\n}')).toHaveLength(1);
    expect(findImportantDeclarations('.a {\n  color: red !IMPORTANT;\n}')).toHaveLength(1);
  });

  // ALL SIX matches in the repo are file headers promising not to use it. Without
  // stripping, guard g flags the six comments that document guard g.
  it('passes !important inside a comment, which is every occurrence in the repo', () => {
    expect(
      findImportantDeclarations(
        '/*\n * Colours come only from semantic tokens; no raw hex, no !important.\n */\n',
      ),
    ).toEqual([]);
  });

  it('passes a declaration that merely contains the word', () => {
    expect(findImportantDeclarations('.a {\n  content: "important";\n}')).toEqual([]);
  });
});

describe('the repo itself obeys guard g', () => {
  // Guard d's lesson: a guard that collects by name passes silently once a file moves.
  it('scans every stylesheet and finds the layers it expects to find', () => {
    const sheets = guardedStyleSheets(REPO_ROOT);
    expect(sheets.length).toBeGreaterThanOrEqual(15);

    let layerBlocks = 0;
    let selectorRules = 0;
    for (const file of sheets) {
      const audit = auditLayerDiscipline(
        readFileSync(file, 'utf-8'),
        path.relative(REPO_ROOT, file),
      );
      layerBlocks += audit.layerBlocks;
      selectorRules += audit.selectorRules;
    }
    expect(layerBlocks).toBeGreaterThanOrEqual(15);
    expect(selectorRules).toBeGreaterThanOrEqual(150);
  });

  // Every one of the 15 files contains an @layer, but that was never the check — a file
  // having @layer once does not prove every RULE sits inside one. This is the assertion
  // the survey could not make.
  it('puts every selector rule inside an @layer block', () => {
    const violations = guardedStyleSheets(REPO_ROOT).flatMap((file) =>
      findUnlayeredRules(readFileSync(file, 'utf-8'), path.relative(REPO_ROOT, file)),
    );
    expect(
      violations,
      `wrap these in an @layer — an unlayered rule beats every layered one:\n${violations
        .map((v) => `  ${v.file}:${v.line} → ${v.detail}`)
        .join('\n')}`,
    ).toEqual([]);
  });

  it('uses no !important anywhere in shipped CSS', () => {
    const violations = guardedStyleSheets(REPO_ROOT).flatMap((file) =>
      findImportantDeclarations(readFileSync(file, 'utf-8'), path.relative(REPO_ROOT, file)),
    );
    expect(
      violations,
      `remove !important and fix the layer order instead:\n${violations
        .map((v) => `  ${v.file}:${v.line} → ${v.detail}`)
        .join('\n')}`,
    ).toEqual([]);
  });
});
