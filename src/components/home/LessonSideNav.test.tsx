/**
 * Tests for LessonSideNav (Phase D) — the left sliding lesson nav, as it arrives in
 * the STATIC page (closed). What is asserted here is the part a static render can
 * prove: the aria wiring, one link per LO, and that a closed panel's links are
 * genuinely out of reach rather than merely off-screen.
 *
 * The rest — Escape, focus trap, focus restore, scroll lock, reduced motion — needs
 * a real browser and is verified there (this suite has no DOM by design).
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { LoIndexEntry } from '@/lo/lo-index';
import LessonSideNav from './LessonSideNav';

const LESSONS: readonly LoIndexEntry[] = [
  { folder: 'lo-00-example', slug: 'example', title: 'Example Learning Object' },
  { folder: 'lo-01-greetings', slug: 'greetings', title: 'Greetings' },
];

describe('LessonSideNav', () => {
  test('renders a toggle button that is collapsed and names its panel', () => {
    const html = renderToStaticMarkup(<LessonSideNav lessons={LESSONS} />);

    expect(html).toMatch(/<button[^>]*aria-expanded="false"/);
    expect(html).toMatch(/<button[^>]*aria-controls="lesson-nav-panel"/);
    expect(html).toContain('id="lesson-nav-panel"');
  });

  test('is one nav landmark with an accessible name, holding a link per LO', () => {
    const html = renderToStaticMarkup(<LessonSideNav lessons={LESSONS} />);

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
    const html = renderToStaticMarkup(<LessonSideNav lessons={LESSONS} />);

    expect(html).toMatch(/id="lesson-nav-panel"[^>]*inert=""/);
    expect(html).toMatch(/id="lesson-nav-panel"[^>]*aria-hidden="true"/);
  });

  test('renders nothing at all for a course with no lessons', () => {
    expect(renderToStaticMarkup(<LessonSideNav lessons={[]} />)).toBe('');
  });
});
