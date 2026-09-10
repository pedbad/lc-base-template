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

  // --- The scroll-driven entrance (§D4 reversed 2026-09-10) ----------------
  // The fade is back, as CSS rather than the reference's IntersectionObserver. All
  // three of these pin failure modes that look like tidying.

  test('the entrance is CSS on a view timeline — no observer came back', () => {
    expect(css).toContain('animation-timeline: view()');
    expect(css).toMatch(/@keyframes back-to-top-enter/);
    expect(html()).not.toContain('style=');
  });

  // THE ONE THAT MATTERS. The base rule must stay VISIBLE: the `from` frame supplies
  // the transparency via fill-mode `both`. Hoist `opacity: 0` into the base rule and
  // every reader who skips the animation — no view-timeline support, or reduced
  // motion — gets a permanently invisible button, which is the reference's defect
  // made worse.
  test('the hidden state lives only in the keyframes, never in the base rule', () => {
    const base = /\.back-to-top \{([\s\S]*?)\n {2}\}/.exec(css)?.[1] ?? '';
    expect(base).not.toMatch(/opacity\s*:/);

    const frames = /@keyframes back-to-top-enter \{([\s\S]*?)\n {6}\}/.exec(css)?.[1] ?? '';
    expect(frames).toMatch(/opacity:\s*0/);
    expect(css).toMatch(/animation:\s*back-to-top-enter linear both/);
  });

  test('the entrance is behind @supports AND opts in via no-preference', () => {
    // @supports so unsupported browsers never see the `from` frame; no-preference
    // rather than a `reduce` override so unknown query support fails CLOSED.
    const guardIndex = css.indexOf('@supports (animation-timeline: view())');
    const prefIndex = css.indexOf('@media (prefers-reduced-motion: no-preference)');
    // The DECLARATION, not the @supports prelude — which contains the same string.
    const animIndex = css.indexOf('animation-timeline: view();');

    expect(guardIndex).toBeGreaterThan(-1);
    expect(prefIndex).toBeGreaterThan(guardIndex);
    expect(animIndex).toBeGreaterThan(prefIndex);
  });

  // Animating `transform` instead would silently kill the hover lift: a filled
  // animation beats an ordinary declaration. `translate` is a separate property and
  // composes with `transform`, so both survive.
  test('keyframes animate translate, not transform, so the hover lift survives', () => {
    const frames = /@keyframes back-to-top-enter \{([\s\S]*?)\n {6}\}/.exec(css)?.[1] ?? '';
    expect(frames).toMatch(/translate:/);
    expect(frames).not.toMatch(/transform:/);
    expect(css).toMatch(/\.back-to-top:hover \{[^}]*transform:\s*translateY\(-2px\)/);
  });
});
