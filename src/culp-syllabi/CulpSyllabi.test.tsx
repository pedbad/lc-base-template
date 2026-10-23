/**
 * CulpSyllabi.test.tsx — the CULP syllabi debug page renders docs/culp-syllabi/README.md,
 * the one source, on a page of its own: its sections in the jump menu, every debug page
 * in the nav with this one current, and a heading outline that never skips a level.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { findHeadingViolations } from '@/guards/semantic-dom';
import CulpSyllabi from './CulpSyllabi';
import { CULP_SYLLABI_SECTIONS } from './culp-syllabi-data';

const html = renderToStaticMarkup(<CulpSyllabi />);
const nav = /<nav[^>]*aria-label="CULP syllabi sections"[^>]*>.*?<\/nav>/s.exec(html)?.[0] ?? '';

describe('CULP syllabi page', () => {
  test('renders the folder README itself: the layout, the hierarchy and the skill', () => {
    expect(html).toContain('Finding the right note');
    expect(html).toMatch(/aria-label="docs\/culp-syllabi\/README\.md code sample 1/);
    expect(html).toContain('culp-syllabus');
  });

  test('offers one jump entry per ## section of the README, each landing on its heading', () => {
    expect(nav).toMatch(/aria-haspopup="menu"[^>]*>[^<]*Jump to section/);
    expect(CULP_SYLLABI_SECTIONS.map((section) => section.label)).toEqual(
      expect.arrayContaining(['Layout', 'Finding the right note']),
    );
    CULP_SYLLABI_SECTIONS.forEach(({ id }) => {
      expect(html).toMatch(new RegExp(`<h3 id="${id}"`));
    });
  });

  test('links to every debug page and course home, marking itself current', () => {
    ['exercise-showcase', 'debug-sandbox', 'ui-showcase', 'code-style', 'culp-syllabi'].forEach(
      (file) => {
        expect(nav).toContain(`href="/${file}.html"`);
      },
    );
    expect(nav.match(/aria-current="page"/g)).toHaveLength(1);
    expect(nav).toMatch(/<a [^>]*href="\/culp-syllabi\.html"[^>]*aria-current="page"/);
    expect(nav).toContain('Course home');
  });

  test('has one h1 and an outline that never skips a level', () => {
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(findHeadingViolations(html)).toEqual([]);
  });

  test('styles its headings at their own levels, as the Code style page does', () => {
    expect(html).toContain('class="doc-prose doc-page-prose');
  });

  test('applies the stored theme before first paint, like the other pages', () => {
    const shell = readFileSync(new URL('../../culp-syllabi.html', import.meta.url), 'utf-8');
    const head = shell.slice(0, shell.indexOf('</head>'));
    expect(head).toContain("localStorage.getItem('lc-theme')");
    expect(head).toContain("classList.add('dark')");
    expect(shell).toContain('src="/src/culp-syllabi/main.tsx"');
  });
});
