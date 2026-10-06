/**
 * Tests for Header (Phase C · Part A, step 1 — spec §1). Rendered to static markup
 * via react-dom/server (no DOM needed under Vitest's node env, matching the
 * exercise-engine test convention). These lock the a11y-critical shell landmarks:
 * one header>nav, the skip-to-main title link, section-derived nav entries,
 * aria-current on the active link, and the mobile toggle/panel contract
 * (aria-expanded + aria-controls + a `hidden` panel). The interactive
 * Escape-closes-and-restores-focus behaviour is verified in the browser (step 7).
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Header from './Header';
import { FOCUS_OUTLINE } from './focus-outline';
import { resolveHomeHref } from '@/lib/assets';
import type { NavSection } from './nav-section';
/** Local section fixture. Sections come from an LO's lo.json in the real app; these
 *  tests exercise the FRAME, so they own a small list rather than importing one
 *  (there is no default list in code any more — see nav-section.ts). */
const SECTIONS: readonly NavSection[] = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'grammar', label: 'Grammar: formal and informal address', navLabel: 'Grammar' },
  { id: 'vocabulary', label: 'Vocabulary' },
  { id: 'exercises', label: 'Exercises' },
];

describe('Header', () => {
  test('renders exactly one header>nav labelled "Main navigation"', () => {
    const html = renderToStaticMarkup(<Header sections={SECTIONS} />);
    expect((html.match(/<header/g) ?? []).length).toBe(1);
    expect((html.match(/<nav/g) ?? []).length).toBe(1);
    expect(html).toContain('aria-label="Main navigation"');
  });

  // Phase D: the brand is the route back to the course landing page. It used to
  // point at #content, duplicating PageLayout's skip link and leaving an LO page
  // with no way back to the course.
  test('renders a brand link home, through the base path', () => {
    const html = renderToStaticMarkup(<Header sections={SECTIONS} siteTitle="My Course" />);
    expect(html).toContain(`href="${resolveHomeHref()}"`);
    expect(html).toContain('My Course');
    expect(html).not.toContain('href="#content"');
  });

  test('derives one nav link per section, in page order, from the section list', () => {
    const html = renderToStaticMarkup(<Header sections={SECTIONS} />);
    for (const section of SECTIONS) {
      expect(html).toContain(`href="#${section.id}"`);
      expect(html).toContain(section.navLabel ?? section.label);
    }
    // Order preserved: grammar's anchor appears before vocabulary's.
    expect(html.indexOf('href="#grammar"')).toBeLessThan(html.indexOf('href="#vocabulary"'));
  });

  test('nav text is navLabel when given, otherwise label', () => {
    const html = renderToStaticMarkup(<Header sections={SECTIONS} />);
    // The grammar section's heading is too long for a nav bar, so it sets navLabel.
    expect(html).toContain('>Grammar<');
    expect(html).not.toContain('Grammar: formal and informal address');
    // Sections without an override keep their label.
    expect(html).toContain('>Vocabulary<');
  });

  // `location`, not `page` (scroll-spy spec S1): the link marks where the reader is
  // WITHIN this page. Both copies — desktop nav and mobile panel — carry it.
  test('marks the active section link with aria-current="location", in both navs', () => {
    const html = renderToStaticMarkup(<Header sections={SECTIONS} activeSectionId="grammar" />);
    expect(html.match(/aria-current="location"/g) ?? []).toHaveLength(2);
    expect(html).toMatch(/href="#grammar" aria-current="location"/);
    expect(html).not.toContain('aria-current="page"');
  });

  test('marks no link when no section is active (the hero, scroll-spy spec S2)', () => {
    const html = renderToStaticMarkup(<Header sections={SECTIONS} activeSectionId="" />);
    expect(html).not.toContain('aria-current');
  });

  test('mobile toggle button wires aria-expanded + aria-controls + an accessible name', () => {
    const html = renderToStaticMarkup(<Header sections={SECTIONS} />);
    expect(html).toContain('aria-controls="mobile-nav-panel"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Toggle navigation menu"');
    expect(html).toMatch(/<button[^>]*type="button"/);
  });

  test('mobile panel carries the id and is hidden while closed (real focus removal)', () => {
    const html = renderToStaticMarkup(<Header sections={SECTIONS} />);
    expect(html).toMatch(/<div[^>]*id="mobile-nav-panel"[^>]*hidden/);
  });

  // The panel is a DISCLOSURE, not a dialog. `LessonRail`'s panel is the dialog — it
  // covers the page, so it traps Tab, scroll-locks and uses `inert`. Copying that
  // here in the name of consistency would strand a keyboard user in a panel with a
  // live, visible page behind it. These two tests exist so that change has to be
  // deliberate rather than accidental.
  test('mobile panel uses hidden, not inert — nothing here is covering the page', () => {
    const html = renderToStaticMarkup(<Header sections={SECTIONS} />);
    const panel = /<div[^>]*id="mobile-nav-panel"[^>]*>/.exec(html)?.[0] ?? '';

    expect(panel).toContain('hidden');
    // `inert` would leave the links in the layout but unfocusable; `hidden` removes
    // them from both, which is the stronger guarantee when there is no animation to
    // preserve.
    expect(panel).not.toContain('inert');
  });

  test('mobile panel follows the toggle in DOM order, so Tab reaches it unaided', () => {
    const html = renderToStaticMarkup(<Header sections={SECTIONS} />);

    // This ordering is WHY no focus-move-in is owed: Tab already walks from the
    // toggle straight into the panel. Move the panel elsewhere in the markup and
    // that stops being true, so the omission would become a real defect.
    expect(html.indexOf('aria-controls="mobile-nav-panel"')).toBeLessThan(
      html.indexOf('id="mobile-nav-panel"'),
    );
  });

  test('brand link carries the course mark, decorative and through resolveAsset', () => {
    const html = renderToStaticMarkup(<Header sections={SECTIONS} />);

    // Decorative: the link already has the course title as its accessible name, so
    // the mark must not be announced as well.
    expect(html).toMatch(/<span[^>]*course-mark[^>]*aria-hidden="true"/);
    // MASKED, never <img>. `currentColor` inside an <img>-loaded SVG resolves against
    // that file's own document and renders black in BOTH themes — invisible on the
    // dark header, which is the bug this replaced. An <img> reappearing here is that
    // bug coming back.
    expect(html).not.toMatch(/<a[^>]*>[^<]*<img/);
    expect(html).toContain('--course-mark:url(/logo.svg)');
    // Through resolveAsset: a bare `logo.svg` resolves against the CURRENT page URL,
    // which breaks on an LO page under a sub-path base. The leading slash is the only
    // visible proof it was resolved at all.
    expect(html).not.toContain('url(logo.svg)');
  });

  // Header a11y audit (2026-10-06). The links used to fall back to the browser's
  // `outline: auto` in `ring/50` — 2.88:1 on the light header, under 1.4.11's 3:1 —
  // and the toggle drew a box-shadow ring with `outline-none`, which Windows forced
  // colours strips, leaving NO indicator. Every control now draws the one shared
  // outline, which survives forced colours and clears 3:1 in both themes.
  test('every link and button draws the shared outline focus indicator', () => {
    const html = renderToStaticMarkup(<Header sections={SECTIONS} />);
    const controls = html.match(/<(a|button)\b[^>]*>/g) ?? [];

    expect(controls.length).toBeGreaterThan(0);
    for (const tag of controls) {
      expect(tag).toContain(FOCUS_OUTLINE);
      expect(tag).not.toContain('focus-visible:outline-none');
    }
  });

  // At 375px the brand title squeezed the 36px toggle to 26px wide — still over 2.5.8's
  // 24px floor, but only just, and no longer the square it is drawn as.
  test('mobile toggle keeps its size beside a long brand title', () => {
    const html = renderToStaticMarkup(<Header sections={SECTIONS} />);
    const toggle = /<button[^>]*aria-controls="mobile-nav-panel"[^>]*>/.exec(html)?.[0] ?? '';

    expect(toggle).toMatch(/\bshrink-0\b/);
  });

  test('renders an optional theme-toggle slot inside the nav', () => {
    const html = renderToStaticMarkup(
      <Header sections={SECTIONS} themeToggle={<span data-testid="toggle-slot" />} />,
    );
    expect(html).toContain('data-testid="toggle-slot"');
  });
});
