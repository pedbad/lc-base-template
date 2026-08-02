/**
 * Tests for PageLayout (Phase C · Part A, step 3 — spec §1/§2). Rendered to static
 * markup. Locks the page frame: skip-link first, one <main id="content"
 * tabindex="-1">, exactly one <h1>, and one <section id aria-labelledby> + <h2>
 * per section with ids from the shared headingId helper. Heading order h1→h2 with
 * no skips (§2). The focus-moves-to-heading-on-nav behaviour is verified in the
 * browser (step 7).
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PageLayout from './PageLayout';
import { headingId } from '@/lib/headingId';
import { DEFAULT_SECTIONS } from './sections';

const sections = DEFAULT_SECTIONS.map((s) => ({ ...s }));

describe('PageLayout', () => {
  test('renders the skip-link before the header, pointing at #content', () => {
    const html = renderToStaticMarkup(<PageLayout title="Lesson" sections={sections} />);
    expect(html).toContain('class="skip-link"');
    expect(html).toContain('href="#content"');
    expect(html.indexOf('skip-link')).toBeLessThan(html.indexOf('<header'));
  });

  test('renders one <main id="content" tabindex="-1"> holding the single <h1>', () => {
    const html = renderToStaticMarkup(<PageLayout title="My Lesson" sections={sections} />);
    expect((html.match(/<main/g) ?? []).length).toBe(1);
    expect(html).toMatch(/<main[^>]*id="content"/);
    expect(html).toMatch(/<main[^>]*tabindex="-1"/);
    expect((html.match(/<h1/g) ?? []).length).toBe(1);
    expect(html).toContain('My Lesson');
  });

  test('renders one <section id aria-labelledby> + <h2> per section, ids from headingId', () => {
    const html = renderToStaticMarkup(<PageLayout title="Lesson" sections={sections} />);
    expect((html.match(/<section/g) ?? []).length).toBe(sections.length);
    for (const section of sections) {
      const hid = headingId(section.id);
      expect(html).toMatch(
        new RegExp(`<section[^>]*id="${section.id}"[^>]*aria-labelledby="${hid}"`),
      );
      expect(html).toMatch(new RegExp(`<h2[^>]*id="${hid}"`));
    }
  });

  test('heading order is h1 then h2 with no skipped level (§2)', () => {
    const html = renderToStaticMarkup(<PageLayout title="Lesson" sections={sections} />);
    expect(html.indexOf('<h1')).toBeLessThan(html.indexOf('<h2'));
    // No decorative heading before the h1 (§5) and no h3+ appears before the first h2.
    expect(html).not.toMatch(/<h[3-6][\s/>]/);
  });

  test('includes the Header nav and the Footer landmarks', () => {
    const html = renderToStaticMarkup(<PageLayout title="Lesson" sections={sections} />);
    expect((html.match(/<header/g) ?? []).length).toBe(1);
    expect((html.match(/<footer/g) ?? []).length).toBe(1);
    expect(html).toContain('aria-label="Main navigation"');
  });

  test('renders per-section content when provided', () => {
    const withContent = [
      { id: 'introduction', label: 'Introduction', content: <p>Hello there</p> },
    ];
    const html = renderToStaticMarkup(<PageLayout title="Lesson" sections={withContent} />);
    expect(html).toContain('Hello there');
  });
});
