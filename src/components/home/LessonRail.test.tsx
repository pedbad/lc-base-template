/**
 * Tests for LessonRail (§D · D7) — the landing page's permanent left rail, as it
 * arrives in the STATIC page (panel closed). What is asserted here is the part a
 * static render can prove: the aria wiring, one link per LO, that a closed panel's
 * links are genuinely out of reach rather than merely off-screen, and that the
 * collapsed strip's social icons come from footer.config.ts rather than a second list.
 *
 * The rest — Escape, focus trap, focus restore, scroll lock, reduced motion — needs
 * a real browser and is verified there (this suite has no DOM by design).
 *
 * These carry over from LessonSideNav.test.tsx unchanged apart from the component
 * name: the open-state behaviour is the same code, and the point of D7 was to keep
 * that bar rather than rebuild it lower.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { footerConfig } from '@/config/footer.config';
import type { LoIndexEntry } from '@/lo/lo-index';
import { FOCUS_OUTLINE } from '@/components/shell/focus-outline';
import LessonRail from './LessonRail';

const LESSONS: readonly LoIndexEntry[] = [
  { folder: 'lo-00-example', slug: 'example', title: 'Example Learning Object' },
  { folder: 'lo-01-greetings', slug: 'greetings', title: 'Greetings' },
];

describe('LessonRail', () => {
  test('renders a toggle button that is collapsed and names its panel', () => {
    const html = renderToStaticMarkup(<LessonRail lessons={LESSONS} />);

    expect(html).toMatch(/<button[^>]*aria-expanded="false"/);
    expect(html).toMatch(/<button[^>]*aria-controls="lesson-nav-panel"/);
    expect(html).toContain('id="lesson-nav-panel"');
  });

  // The toggle is icon-only, so without this it announces as "button" and nothing
  // else — the whole rail would be unnamed to a screen reader.
  test('the icon-only toggle carries a visually hidden name', () => {
    const html = renderToStaticMarkup(<LessonRail lessons={LESSONS} />);

    expect(html).toContain('<span class="sr-only">Lessons</span>');
  });

  test('is one nav landmark with an accessible name, holding a link per LO', () => {
    const html = renderToStaticMarkup(<LessonRail lessons={LESSONS} />);

    expect((html.match(/<nav/g) ?? []).length).toBe(1);
    expect(html).toMatch(/<nav[^>]*aria-label="Lessons"/);
    expect(html).toContain('href="/example.html"');
    expect(html).toContain('href="/greetings.html"');
  });

  // Closed means UNREACHABLE, not just translated out of view: `inert` pulls the
  // links out of the tab order and the AT tree together, so a keyboard user cannot
  // tab into an invisible panel (the axe "aria-hidden with focusable descendants"
  // failure). `hidden` would do that too, but cannot slide.
  test('marks the closed panel inert and hidden from assistive tech', () => {
    const html = renderToStaticMarkup(<LessonRail lessons={LESSONS} />);

    expect(html).toMatch(/id="lesson-nav-panel"[^>]*inert=""/);
    expect(html).toMatch(/id="lesson-nav-panel"[^>]*aria-hidden="true"/);
  });

  // Header a11y audit (2026-10-06). The panel BEHAVES as a modal dialog — focus moves
  // in, Tab is trapped, the page is scroll-locked — but announced as nothing, so a
  // screen-reader user's virtual cursor could walk out of it into the page behind,
  // which is not inert. `aria-modal` is what tells AT that page is out of bounds.
  test('the panel is a modal dialog named by its own "Lessons" title', () => {
    const html = renderToStaticMarkup(<LessonRail lessons={LESSONS} />);
    const panel = /<div[^>]*id="lesson-nav-panel"[^>]*>/.exec(html)?.[0] ?? '';
    const labelId = /aria-labelledby="([^"]+)"/.exec(panel)?.[1];

    expect(panel).toContain('role="dialog"');
    expect(panel).toContain('aria-modal="true"');
    expect(labelId).toBeDefined();
    expect(html).toMatch(new RegExp(`<p[^>]*id="${labelId}"[^>]*>Lessons</p>`));
  });

  // Same audit: these drew a box-shadow ring over `outline-none`, and forced colours
  // strips box-shadow, so they had no focus indicator at all there.
  test('every control in the panel draws the shared outline focus indicator', () => {
    const html = renderToStaticMarkup(<LessonRail lessons={LESSONS} />);
    const panel = html.slice(html.indexOf('id="lesson-nav-panel"'));
    const controls = panel.match(/<(a|button)\b[^>]*>/g) ?? [];

    expect(controls.length).toBe(LESSONS.length + 1);
    for (const tag of controls) {
      expect(tag).toContain(FOCUS_OUTLINE);
      expect(tag).not.toContain('focus-visible:outline-none');
    }
  });

  // The strip is unconditional; only the LESSON parts depend on there being lessons.
  // A half-built course keeps its theme control and its social links — losing dark mode
  // would be a strange way to discover that no lessons exist yet.
  test('a course with no lessons keeps the strip but loses the menu and the panel', () => {
    const html = renderToStaticMarkup(<LessonRail lessons={[]} />);

    expect(html).toContain('class="lesson-rail"');
    expect(html).toContain('aria-label="Dark mode"');
    expect(html).toContain('lesson-rail-social-link');
    expect(html).not.toContain('lesson-nav-panel');
    expect(html).not.toContain('aria-controls');
    expect(html).not.toContain('<nav');
  });

  // The rail is the landing page's only chrome now, so the theme control lives in it.
  // `role="switch"` + `aria-checked` matches spec §1 and the LO page's ThemeToggle —
  // and the name is the fixed string "Dark mode", NOT a label that flips to "Light
  // mode", which §1 bans because a reader cannot tell whether such a name describes the
  // state or the action.
  test('carries the theme control as a named switch, not a label that flips', () => {
    const html = renderToStaticMarkup(<LessonRail lessons={LESSONS} />);

    expect(html).toMatch(/<button[^>]*role="switch"/);
    expect(html).toMatch(/<button[^>]*aria-label="Dark mode"/);
    expect(html).not.toContain('Light mode');
  });

  // Prerendered markup must equal the first client render, and `useTheme`'s server
  // snapshot is pinned to 'light' for exactly that reason. If this ever renders
  // `aria-checked="true"`, the server snapshot has been lost and dark-theme readers
  // get a hydration mismatch.
  test('the theme control ships in its light-theme position, whatever the environment', () => {
    const html = renderToStaticMarkup(<LessonRail lessons={LESSONS} />);

    expect(html).toContain('aria-checked="false"');
    expect(html).not.toContain('aria-checked="true"');
  });

  // The thumb's resting position is CSS driven off aria-checked, so the icons must both
  // be present and distinguishable in the static markup for that selector to have
  // anything to act on.
  test('the switch ships both icons, tagged so CSS can mark the selected one', () => {
    const html = renderToStaticMarkup(<LessonRail lessons={LESSONS} />);

    expect(html).toContain('data-slot="light"');
    expect(html).toContain('data-slot="dark"');
    expect(html).toContain('lesson-rail-theme-thumb');
  });

  // The D7 decision that is worth a guard rather than a comment: the rail shows the
  // SAME accounts the footer does, read from the one config. A rail that declared its
  // own array would pass every other test here and drift the day someone adds an
  // account — which is exactly the defect footer.config.ts exists to prevent.
  test('the collapsed strip reads its social accounts from footer.config.ts', () => {
    const html = renderToStaticMarkup(<LessonRail lessons={LESSONS} />);

    for (const account of footerConfig.social) {
      expect(html).toContain(`href="${account.href}"`);
      expect(html).toContain(`#${account.icon}`);
      expect(html).toContain(account.label);
    }
  });

  // `role="group"` and NOT a second <nav>: spec §17 allows one nav landmark per page
  // and the lesson panel above owns it. A nav here fails guard h on this page.
  test('the social strip is a labelled group, not a second nav landmark', () => {
    const html = renderToStaticMarkup(<LessonRail lessons={LESSONS} />);

    expect(html).toMatch(/<div[^>]*role="group"[^>]*aria-label="Follow us"/);
    expect((html.match(/<nav/g) ?? []).length).toBe(1);
  });

  // Every social account leaves the site, and every one of them says so — the pairing
  // FooterLink makes for the footer's copies, restated here because this markup is
  // the rail's own.
  test('social links open in a new tab, safely, and announce that they do', () => {
    const html = renderToStaticMarkup(<LessonRail lessons={LESSONS} />);
    const links = html.match(/<a[^>]*class="lesson-rail-social-link"[^>]*>/g) ?? [];

    expect(links.length).toBe(footerConfig.social.length);
    for (const link of links) {
      expect(link).toContain('target="_blank"');
      expect(link).toContain('rel="noopener noreferrer"');
    }
    expect(html).toContain('(opens in a new tab)');
  });

  // Prerender/hydration parity (handover §3) is the hard constraint D7 had to answer,
  // and the answer was to hand-roll rather than import shadcn's Sidebar, which reads a
  // cookie on mount. Two identical static renders is the cheap proof that nothing in
  // the collapsed rail depends on anything the server does not have.
  test('the static render is deterministic — nothing here reads the client', () => {
    const first = renderToStaticMarkup(<LessonRail lessons={LESSONS} />);
    const second = renderToStaticMarkup(<LessonRail lessons={LESSONS} />);

    expect(first).toBe(second);
    expect(first).not.toContain('sidebar_state');
  });
});
