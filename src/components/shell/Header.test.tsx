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

  test('renders a skip-to-main title link pointing at #content', () => {
    const html = renderToStaticMarkup(<Header sections={SECTIONS} siteTitle="My Course" />);
    expect(html).toContain('href="#content"');
    expect(html).toContain('My Course');
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

  test('marks the active section link with aria-current', () => {
    const html = renderToStaticMarkup(<Header sections={SECTIONS} activeSectionId="grammar" />);
    expect(html).toMatch(/aria-current="(true|page)"/);
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

  test('renders an optional theme-toggle slot inside the nav', () => {
    const html = renderToStaticMarkup(
      <Header sections={SECTIONS} themeToggle={<span data-testid="toggle-slot" />} />,
    );
    expect(html).toContain('data-testid="toggle-slot"');
  });
});
