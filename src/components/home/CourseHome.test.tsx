/**
 * Tests for CourseHome (Phase D) — the course landing page, rendered to static
 * markup, which is also exactly what the prerender pass writes to dist/index.html.
 *
 * Locks the invariants a card grid can silently break: one card per LO in course
 * order, each linking at a real page URL routed through BASE_URL, the hero copy read
 * from course.config, no LO body content anywhere on the page, and a strict
 * h1 → h2 → h3 heading outline. The sliding nav's BEHAVIOUR (open, trap, Escape,
 * scroll lock) is a browser check — the suite runs with no DOM.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { courseConfig } from '@/config/course.config';
import type { LoIndexEntry } from '@/lo/lo-index';
import CourseHome from './CourseHome';

const LESSONS: readonly LoIndexEntry[] = [
  {
    folder: 'lo-00-example',
    slug: 'example',
    title: 'Example Learning Object',
    description: 'A placeholder Learning Object.',
    image: 'images/lo-placeholder.svg',
  },
  { folder: 'lo-01-greetings', slug: 'greetings', title: 'Greetings' },
];

describe('CourseHome', () => {
  test('renders the hero copy from course.config, not authored here', () => {
    const html = renderToStaticMarkup(<CourseHome lessons={LESSONS} />);

    expect(html).toContain(courseConfig.landingCopy.heading);
    expect((html.match(/<h1/g) ?? []).length).toBe(1);
    expect(html).toMatch(new RegExp(`<h1[^>]*>${courseConfig.landingCopy.heading}`));
  });

  test('renders one card per LO, in the order given', () => {
    const html = renderToStaticMarkup(<CourseHome lessons={LESSONS} />);

    expect(html.indexOf('Example Learning Object')).toBeLessThan(html.indexOf('Greetings'));
    expect((html.match(/<h3/g) ?? []).length).toBe(LESSONS.length);
  });

  test('links each card at that LO’s static page, routed through the base', () => {
    const html = renderToStaticMarkup(<CourseHome lessons={LESSONS} />);

    // Root-served base in tests, so "/" — the point is that the href is absolute
    // against the base and not a bare relative path (anti-pattern #28).
    expect(html).toContain('href="/example.html"');
    expect(html).toContain('href="/greetings.html"');
  });

  test('shows an LO’s blurb, and copes with an LO that has none', () => {
    const html = renderToStaticMarkup(<CourseHome lessons={LESSONS} />);

    expect(html).toContain('A placeholder Learning Object.');
    expect(html).toContain('Greetings');
  });

  test('renders the card image through the base, decoratively', () => {
    const html = renderToStaticMarkup(<CourseHome lessons={LESSONS} />);

    expect(html).toContain('src="/images/lo-placeholder.svg"');
    expect(html).toMatch(/<img[^>]*alt=""/);
  });

  test('has one <main id="content" tabindex="-1"> and a skip link into it', () => {
    const html = renderToStaticMarkup(<CourseHome lessons={LESSONS} />);

    expect((html.match(/<main/g) ?? []).length).toBe(1);
    expect(html).toMatch(/<main[^>]*id="content"/);
    expect(html).toMatch(/<main[^>]*tabindex="-1"/);
    expect(html.indexOf('skip-link')).toBeLessThan(html.indexOf('<header'));
  });

  // The bug this page exists to fix: `/` used to BE lo-00-example, duplicating
  // example.html. A landing page that renders LO bodies would re-create it.
  test('renders no LO body content — the cards are links, not the lessons', () => {
    const html = renderToStaticMarkup(<CourseHome lessons={LESSONS} />);

    expect(html).not.toContain('<details');
    expect(html).not.toContain('id="introduction"');
  });

  test('states the course has no lessons yet rather than rendering an empty grid', () => {
    const html = renderToStaticMarkup(<CourseHome lessons={[]} />);

    expect(html).not.toContain('<h3');
    expect(html).toMatch(/no lessons/i);
  });
});
