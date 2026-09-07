/**
 * token-integrity.test.ts — guard f (buildlist 24).
 *
 * Two halves, deliberately weighted the same way the survey found the risk:
 * a handful of `it`s prove a real bypass is CAUGHT, and a larger block proves
 * CORRECT code is left alone. The repo was already compliant when this guard was
 * written (§A-f), so every false positive is a bug in the guard itself, and a
 * guard that fires on the comment explaining it gets switched off within a day.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { guardedStyleSheets } from './css-source';
import {
  auditCssTokens,
  findCssTokenBypasses,
  findMarkupTokenBypasses,
  guardedMarkupFiles,
} from './token-integrity';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

/** Wraps a declaration the way every component stylesheet in the repo does. */
const inLayer = (body: string): string => `@layer components {\n  .thing {\n    ${body}\n  }\n}`;

describe('auditCssTokens — catches a value that bypasses the token chain', () => {
  it('flags raw px on a property where a token belongs', () => {
    const found = findCssTokenBypasses(inLayer('padding: 24px;'));
    expect(found).toHaveLength(1);
    expect(found[0]?.rule).toBe('raw-px');
    expect(found[0]?.detail).toContain('padding');
  });

  it('flags raw px on each of the spacing and type properties spec §138 names', () => {
    for (const decl of [
      'font-size: 14px;',
      'margin: 8px;',
      'gap: 12px;',
      'width: 320px;',
      'height: 48px;',
      'inset: 0 0 0 16px;',
      'top: 4px;',
    ]) {
      expect(findCssTokenBypasses(inLayer(decl)), decl).toHaveLength(1);
    }
  });

  it('flags a raw hex colour outside palette.css', () => {
    const found = findCssTokenBypasses(inLayer('color: #cdd2d8;'), 'src/components/home/home.css');
    expect(found).toHaveLength(1);
    expect(found[0]?.rule).toBe('raw-hex');
  });

  it('flags a hex hidden in a component-level custom property', () => {
    // The px half exempts custom properties (declaring a token is the sanctioned way
    // to name a raw value); the hex half does NOT — Layer 1 is palette.css alone.
    const found = findCssTokenBypasses(inLayer('--card-tint: #f0f0f0;'), 'src/x.css');
    expect(found).toHaveLength(1);
    expect(found[0]?.rule).toBe('raw-hex');
  });

  it('reports where it found it, so the failure is actionable', () => {
    const found = findCssTokenBypasses(inLayer('padding: 24px;'), 'home.css');
    expect(found[0]?.file).toBe('home.css');
    expect(found[0]?.line).toBe(3);
  });
});

describe('auditCssTokens — leaves the compliant repo alone', () => {
  // 44 of the repo's 52 px sites are 1–4px hairlines and focus rings, where px is the
  // CORRECT unit and rem would be wrong. A blanket ban would flag all of them (§A-f 3).
  it('passes px on every property the allowlist names', () => {
    for (const decl of [
      'border: 1px solid var(--border);',
      'border-top: 1px solid var(--border);',
      'border-left: 2px solid var(--accent);',
      'border-inline-end: 1px solid var(--border);',
      'border-radius: 999px;',
      'outline: 2px solid var(--ring);',
      'outline-offset: 3px;',
      'box-shadow: 0 12px 28px -12px var(--ring);',
      'backdrop-filter: blur(3px);',
      'perspective: 1400px;',
      'transform: translateY(-4px);',
    ]) {
      expect(findCssTokenBypasses(inLayer(decl)), decl).toEqual([]);
    }
  });

  // THE FALSE-POSITIVE TRAP the survey came back the opposite way on. Four sites in the
  // repo read `calc(var(--radius) ± 4px)`. That goes THROUGH the token — a derivative
  // offset, not a bypass. Flagging it would flag correct code on day one.
  it('passes a px offset inside a calc() that references a token', () => {
    expect(findCssTokenBypasses(inLayer('border-radius: calc(var(--radius) + 4px);'))).toEqual([]);
    expect(findCssTokenBypasses(inLayer('padding: calc(var(--space-2) - 2px);'))).toEqual([]);
    expect(findCssTokenBypasses(inLayer('width: min(var(--stage-w), 320px);'))).toEqual([]);
  });

  // …but a calc() with no token in it is still a bypass wearing a hat.
  it('still flags a calc() that references no token', () => {
    expect(findCssTokenBypasses(inLayer('padding: calc(100% - 24px);'))).toHaveLength(1);
  });

  // Third guard in a row whose correctness turns on this (c, f, g).
  it('passes px and hex inside comment bodies', () => {
    // tokens-variant-a/b/c document their brand colour in the file header: 4 hits,
    // all comments. index.css explains why `font-size: 100%` is not `16px`.
    expect(findCssTokenBypasses('/* Primary = Cambridge Blue (#8EE8D8) */')).toEqual([]);
    expect(findCssTokenBypasses(inLayer('font-size: 100%; /* = 16px default */'))).toEqual([]);
    expect(
      findCssTokenBypasses(`@layer base {\n  html {\n    /* padding: 24px is wrong */\n  }\n}`),
    ).toEqual([]);
  });

  it('passes the 17 hex primitives in palette.css, which is Layer 1', () => {
    const palette = '@layer base {\n  :root {\n    --slate-3: #546072;\n  }\n}';
    expect(findCssTokenBypasses(palette, 'src/styles/palette.css')).toEqual([]);
    expect(findCssTokenBypasses(palette, 'src/x.css')).toHaveLength(1);
  });

  it('passes a px length in a media query, which is a breakpoint not a value', () => {
    const css =
      '@layer components {\n  @media (width >= 980px) {\n    .a {\n      gap: 1rem;\n    }\n  }\n}';
    expect(findCssTokenBypasses(css)).toEqual([]);
  });

  it('passes px in a custom property — naming a raw value is what a token IS', () => {
    expect(findCssTokenBypasses(inLayer('--hairline: 1px;'))).toEqual([]);
  });

  it('passes relative units and token references', () => {
    expect(findCssTokenBypasses(inLayer('padding: var(--space-3);'))).toEqual([]);
    expect(findCssTokenBypasses(inLayer('font-size: 1.125rem;'))).toEqual([]);
    expect(findCssTokenBypasses(inLayer('width: 8ch;'))).toEqual([]);
    expect(
      findCssTokenBypasses(inLayer('color: color-mix(in oklab, var(--primary) 60%, #fff);')),
    ).toHaveLength(1);
  });

  it('counts what it saw, so a rename cannot quietly empty the sweep', () => {
    const audit = auditCssTokens(inLayer('border: 1px solid var(--border);'));
    expect(audit.pxSites).toBe(1);
    expect(audit.violations).toEqual([]);
  });
});

describe('findMarkupTokenBypasses — the TSX surface', () => {
  it('flags a Tailwind arbitrary value holding a raw px or hex', () => {
    expect(findMarkupTokenBypasses(`<div className="p-[24px]" />`)).toHaveLength(1);
    expect(findMarkupTokenBypasses(`<div className="bg-[#ff0000]" />`)).toHaveLength(1);
  });

  it('flags a hardcoded colour or length in an inline style object', () => {
    expect(findMarkupTokenBypasses(`<div style={{ color: '#ff0000' }} />`)).toHaveLength(1);
    expect(findMarkupTokenBypasses(`<div style={{ marginTop: '24px' }} />`)).toHaveLength(1);
  });

  // §A-f 4: `min-[980px]:hidden` / `:block` in LineMatchExercise.tsx is an arbitrary
  // BREAKPOINT — a media query, which the CSS half already allows.
  it('passes an arbitrary breakpoint variant', () => {
    expect(findMarkupTokenBypasses(`<ol className="space-y-3 min-[980px]:hidden" />`)).toEqual([]);
    expect(findMarkupTokenBypasses(`<div className="hidden max-[640px]:block" />`)).toEqual([]);
  });

  it('passes an arbitrary value that references a token', () => {
    expect(
      findMarkupTokenBypasses(`<div className="rounded-[min(var(--radius-md),10px)]" />`),
    ).toEqual([]);
    expect(findMarkupTokenBypasses(`<div style={{ accentColor: 'var(--primary)' }} />`)).toEqual(
      [],
    );
  });

  it('passes a computed length, which no author can hardcode', () => {
    // LoAccordion.tsx animates `${fromPx}px` — a template expression, not a literal.
    expect(findMarkupTokenBypasses('element.animate([{ height: `${fromPx}px` }])')).toEqual([]);
    expect(findMarkupTokenBypasses('style={{ width: `${meta?.widthCh ?? 8}ch` }}')).toEqual([]);
  });

  // `&#233;` is a decimal HTML entity, not a 3-digit hex colour. html.ts documents both.
  it('passes a numeric HTML entity', () => {
    expect(findMarkupTokenBypasses(`const decoded = raw.replace('&#233;', 'é');`)).toEqual([]);
  });

  it('passes px and hex inside comments', () => {
    expect(findMarkupTokenBypasses(`// mobile (<980px): picks its word with a <Select>`)).toEqual(
      [],
    );
    expect(findMarkupTokenBypasses(`/* Primary is #8EE8D8 */`)).toEqual([]);
  });
});

describe('the repo itself obeys guard f', () => {
  // Guard d's lesson: a guard that collects by name passes silently once a file moves.
  // These floors make a rename fail loudly instead of switching the guard off.
  it('scans every stylesheet in the repo', () => {
    expect(guardedStyleSheets(REPO_ROOT).length).toBeGreaterThanOrEqual(15);
  });

  it('scans a meaningful number of markup files, minus the shadcn surface', () => {
    const files = guardedMarkupFiles(REPO_ROOT);
    expect(files.length).toBeGreaterThanOrEqual(100);
    expect(files.some((f) => f.includes(`${path.sep}components${path.sep}ui${path.sep}`))).toBe(
      false,
    );
  });

  it('still finds the px hairlines and the palette primitives it is meant to see', () => {
    let pxSites = 0;
    let hexLiterals = 0;
    for (const file of guardedStyleSheets(REPO_ROOT)) {
      const audit = auditCssTokens(readFileSync(file, 'utf-8'), path.relative(REPO_ROOT, file));
      pxSites += audit.pxSites;
      hexLiterals += audit.hexLiterals;
    }
    expect(pxSites).toBeGreaterThanOrEqual(50);
    expect(hexLiterals).toBeGreaterThanOrEqual(17);
  });

  // The narrowest floor, and the one most likely to save the guard: if palette.css is
  // renamed or moved, the hex exemption silently stops applying to anything AND the
  // file-scoped rule silently stops being tested. Assert the exemption is still earning
  // its keep rather than sitting over an empty file.
  it('still reads the 17 primitives out of palette.css itself', () => {
    const palette = path.join(REPO_ROOT, 'src/styles/palette.css');
    const audit = auditCssTokens(readFileSync(palette, 'utf-8'), 'src/styles/palette.css');
    expect(audit.hexLiterals).toBeGreaterThanOrEqual(17);
    expect(audit.violations).toEqual([]);
  });

  it('routes every colour and length in CSS through the token chain', () => {
    const violations = guardedStyleSheets(REPO_ROOT).flatMap((file) =>
      findCssTokenBypasses(readFileSync(file, 'utf-8'), path.relative(REPO_ROOT, file)),
    );
    expect(
      violations,
      `use a token or a relative unit:\n${violations
        .map((v) => `  ${v.file}:${v.line} → ${v.rule}: ${v.detail}`)
        .join('\n')}`,
    ).toEqual([]);
  });

  it('hardcodes no colour or length in first-party markup', () => {
    const violations = guardedMarkupFiles(REPO_ROOT).flatMap((file) =>
      findMarkupTokenBypasses(readFileSync(file, 'utf-8'), path.relative(REPO_ROOT, file)),
    );
    expect(
      violations,
      `use a token:\n${violations
        .map((v) => `  ${v.file}:${v.line} → ${v.rule}: ${v.detail}`)
        .join('\n')}`,
    ).toEqual([]);
  });
});
