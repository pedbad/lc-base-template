/**
 * Tests for BackToTopButton (§D · D4).
 *
 * These pin the four defects the reference shipped, because none of them is caught by
 * the gate. Guard h checks landmarks, labels and heading order; it does NOT compare
 * two buttons' accessible names, and nothing anywhere checks for a focus ring.
 *
 * 1. NO HIDDEN STATE. The reference wrapped this in an IntersectionObserver that
 *    faded it in over 3600ms, leaving an `opacity-0 pointer-events-none
 *    tabIndex={-1}` button sitting in the accessibility tree until then. It is an
 *    IN-FLOW element — it is visible when you scroll to it — so the observer was
 *    machinery re-implementing scrolling, and deleting it removed both defects
 *    outright. These tests assert the hidden state is gone and stays gone.
 * 2. UNIQUE DESCRIPTION. About five of these render per LO, all named "Back to top";
 *    `aria-describedby` pointing at the owning section's heading is what makes them
 *    distinguishable ("Back to top, Exercises").
 * 3. A FOCUS RING EXISTS. Dropping shadcn `Button` for a plain `<button>` drops its
 *    ring with it, so the CSS is asserted here — including the rule ORDER, because
 *    stylelint's `no-descending-specificity` bit `:hover` twice in §D1.
 * 4. type="button". shadcn `Button` set this; a plain `<button>` defaults to `submit`,
 *    which would post a form on click if one ever wrapped it.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import BackToTopButton from './BackToTopButton';
import { headingId } from '@/lib/headingId';

const html = (sectionId = 'exercises') =>
  renderToStaticMarkup(<BackToTopButton sectionId={sectionId} />);

const css = readFileSync(path.join(import.meta.dirname, 'back-to-top.css'), 'utf8');

/** Comments stripped, so an assertion about the RULES is not satisfied or broken by
 *  prose. Guard g strips them for the same reason: every `!important` in this repo
 *  sits in a header promising not to use one. */
const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('BackToTopButton', () => {
  test('renders exactly one button and no wrapper element', () => {
    expect((html().match(/<button\b/g) ?? []).length).toBe(1);
    expect(html()).not.toContain('<div');
  });

  test('is type="button" — a plain <button> defaults to submit', () => {
    expect(html()).toMatch(/<button[^>]*type="button"/);
  });

  test('is named "Back to top"', () => {
    expect(html()).toMatch(/<button[^>]*aria-label="Back to top"/);
  });

  test('describes itself by its section heading, so five of them differ', () => {
    expect(html('vocabulary')).toMatch(
      new RegExp(`<button[^>]*aria-describedby="${headingId('vocabulary')}"`),
    );
  });

  test('derives that id through headingId — never a second id scheme (§5)', () => {
    // The literal is what a hand-rolled scheme would drift from.
    expect(html('grammar')).toContain('aria-describedby="grammar-heading"');
  });

  test('the icon is decorative — the label is the name, not the picture', () => {
    const svgs = html().match(/<svg[^>]*>/g) ?? [];
    expect(svgs.length).toBe(1);
    expect(svgs[0]).toContain('aria-hidden="true"');
  });

  test('carries no hidden state: the observer, the fade and tabIndex are gone', () => {
    const markup = html();
    expect(markup).not.toContain('opacity-0');
    expect(markup).not.toContain('pointer-events-none');
    expect(markup).not.toContain('tabindex');
    expect(markup).not.toContain('inert');
  });

  test('needs no Tooltip — it would only repeat the aria-label', () => {
    expect(html()).not.toMatch(/data-slot="tooltip/);
  });

  test('the stylesheet gives it a focus ring, which shadcn Button no longer supplies', () => {
    expect(css).toMatch(/\.back-to-top:focus-visible\s*\{[^}]*outline:/);
  });

  test('the :focus-visible rule is declared AFTER the plain class', () => {
    // no-descending-specificity: a (0,2,0) selector before its (0,1,0) base makes the
    // cascade read backwards. It flagged :hover twice during §D1.
    const base = css.indexOf('.back-to-top {');
    const focus = css.indexOf('.back-to-top:focus-visible');
    expect(base).toBeGreaterThan(-1);
    expect(focus).toBeGreaterThan(base);
  });

  test('the hit target clears WCAG 2.2 SC 2.5.8 (24x24 CSS px)', () => {
    // rem, so the target grows with the reader's font size rather than pinning to px.
    const size = /--back-to-top-size:\s*([\d.]+)rem/.exec(css);
    expect(size).not.toBeNull();
    expect(Number(size?.[1]) * 16).toBeGreaterThanOrEqual(24);
  });

  test('every rule sits inside @layer components (guard g)', () => {
    expect(css).toContain('@layer components {');
  });

  test('is mint from tokens in both themes, with no dark-mode rule at all', () => {
    expect(css).toMatch(/background-color:\s*var\(--accent\)/);
    expect(css).toMatch(/color:\s*var\(--accent-foreground\)/);
    // --accent is --cam-blue in BOTH token blocks, so a `.dark` override would only
    // be a chance to disagree with itself.
    expect(css).not.toContain('.dark');
  });

  // THE BUG THIS PINS, found by measuring rather than reading. The hover first mixed
  // toward --primary, which is --cam-dark-blue in light but --cam-blue in dark — the
  // SAME primitive as --accent. So in dark mode the hover resolved to the rest colour
  // exactly: 1.00:1, no hover at all. --foreground was tried next and was nearly as
  // bad (1.05:1), because mint is already bright and the dark theme's --foreground is
  // near-white. --accent-foreground is --slate-4 in both blocks, so it darkens by the
  // same amount either side: measured #75bab0, 1.56:1 against rest, in both themes.
  test('darkens on hover via a theme-invariant mix, not --primary or --foreground', () => {
    const hover = /\.back-to-top:hover\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';

    expect(hover).toContain('color-mix(in oklab, var(--accent) 78%, var(--accent-foreground))');
    expect(hover).not.toMatch(/var\(--primary\)/);
    expect(hover).not.toMatch(/var\(--foreground\)/);
  });

  test('is inset from the content edge, not flush against it', () => {
    // Flush (margin-inline: auto 0) read as hanging off the text block, because
    // nothing on the page draws a panel boundary for it to sit against.
    expect(css).toMatch(/margin-inline:\s*auto\s+0\.75rem/);
  });

  // --- The reveal (§D4 reversed 2026-09-10, then re-done) -----------------
  // First rebuilt as `animation-timeline: view()` with no JS. Measurably wrong: a
  // view timeline is positional, so the three of four buttons already on screen at
  // load sat past `entry 100%` and never faded. These pin the replacement.

  test('no view timeline remains — it could not express "first time seen"', () => {
    // The header still DISCUSSES the abandoned approach, which is why this reads the
    // comment-stripped rules rather than the file.
    expect(rules).not.toContain('animation-timeline');
    expect(rules).not.toContain('@keyframes');
    expect(css).toContain('animation-timeline'); // i.e. only in the prose
  });

  // THE ONE THAT MATTERS. The transparency must be conditional on `js-reveal`, which
  // index.html adds before first paint and only when IntersectionObserver exists and
  // the reader has not asked for reduced motion. Hoist it into the base rule and
  // every reader on those paths gets a permanently invisible button.
  test('the hidden state is conditional on js-reveal, never unconditional', () => {
    expect(css).toMatch(/\.js-reveal \.back-to-top:not\(\[data-seen\]\) \{[^}]*opacity:\s*0/);

    const base = /\n {2}\.back-to-top \{([\s\S]*?)\n {2}\}/.exec(css)?.[1] ?? '';
    expect(base).not.toMatch(/opacity\s*:/);
  });

  test('index.html arms the reveal before paint, and only when it is safe to', () => {
    const shell = readFileSync(path.join(import.meta.dirname, '../../../index.html'), 'utf8');

    // Inline and in <head>: a deferred module or a React effect would paint the
    // prerendered buttons visible, then hide them, then fade — a flash every load.
    expect(shell.indexOf('js-reveal')).toBeLessThan(shell.indexOf('</head>'));
    expect(shell).toContain("'IntersectionObserver' in window");
    expect(shell).toContain("!window.matchMedia('(prefers-reduced-motion: reduce)').matches");
  });

  test('the reveal transitions translate, not transform, so the hover lift survives', () => {
    // Separate properties that compose; sharing one would make the reveal and the
    // hover fight over the same value.
    expect(css).toMatch(/\.js-reveal \.back-to-top:not\(\[data-seen\]\) \{[^}]*translate:/);
    expect(css).toMatch(/\.back-to-top:hover \{[^}]*transform:\s*translateY\(-2px\)/);
  });

  // SLOW IN, QUICK OUT. A transition is read from the state being moved TO, so the
  // base rule times the arrival and the hidden rule times the departure. 900ms in was
  // the first attempt and was too brisk to notice; 3600ms matches the reference.
  test('arrives slowly and leaves quickly, like the reference', () => {
    const base = /\n {2}\.back-to-top \{([\s\S]*?)\n {2}\}/.exec(rules)?.[1] ?? '';
    const hidden =
      /\.js-reveal \.back-to-top:not\(\[data-seen\]\) \{([\s\S]*?)\n {2}\}/.exec(rules)?.[1] ?? '';

    expect(base).toMatch(/opacity 3600ms/);
    expect(base).toMatch(/translate 3600ms/);
    expect(hidden).toMatch(/opacity 300ms/);
    expect(hidden).toMatch(/translate 300ms/);
  });
});
