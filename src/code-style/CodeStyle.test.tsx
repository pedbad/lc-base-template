/**
 * CodeStyle.test.tsx — the Code style debug page renders docs/STYLE.md, the one source,
 * on a page of its own: its sections in the jump menu, the other debug pages in the nav,
 * and a heading outline that starts at the page's h1 and never skips a level.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { findHeadingViolations } from '@/guards/semantic-dom';
import CodeStyle from './CodeStyle';
import { CODE_STYLE_SECTIONS } from './code-style-data';

const html = renderToStaticMarkup(<CodeStyle />);
const nav = /<nav[^>]*aria-label="Code style sections"[^>]*>.*?<\/nav>/s.exec(html)?.[0] ?? '';

describe('Code style page', () => {
  test('renders docs/STYLE.md itself, code examples included', () => {
    expect(html).toContain('Habits nothing enforces');
    expect(html).toMatch(
      /<pre tabindex="0" role="region" aria-label="docs\/STYLE\.md code sample 1/,
    );
  });

  test('offers one jump entry per ## section of the guide, each landing on its heading', () => {
    expect(nav).toMatch(/aria-haspopup="menu"[^>]*>[^<]*Jump to section/);
    expect(CODE_STYLE_SECTIONS.map((section) => section.label)).toContain(
      'Habits nothing enforces',
    );
    CODE_STYLE_SECTIONS.forEach(({ id }) => {
      expect(html).toMatch(new RegExp(`<h3 id="${id}"`));
    });
  });

  test('links to every debug page and course home, marking itself current', () => {
    [
      'exercise-showcase',
      'debug-sandbox',
      'ui-showcase',
      'code-style',
      'culp-syllabi',
      'claude-skills',
    ].forEach((file) => {
      expect(nav).toContain(`href="/${file}.html"`);
    });
    expect(nav.match(/aria-current="page"/g)).toHaveLength(1);
    expect(nav).toMatch(/<a [^>]*href="\/code-style\.html"[^>]*aria-current="page"/);
    expect(nav).toContain('Course home');
  });

  test('has one h1 and an outline that never skips a level', () => {
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(findHeadingViolations(html)).toEqual([]);
  });

  // The hub's prose styles size h4–h6, where its docs' headings land. Here the guide's
  // headings are h2–h4, so the page asks for the page-level sizes.
  test('styles its headings at their own levels, not the hub', () => {
    expect(html).toContain('class="doc-prose doc-page-prose');
    const css = readFileSync(new URL('../sandbox/sandbox.css', import.meta.url), 'utf-8');
    ['h2', 'h3', 'h4'].forEach((tag) => {
      expect(css).toMatch(new RegExp(`\\.doc-page-prose ${tag} \\{[^}]*font-size`));
    });
  });

  test('applies the stored theme before first paint, like the other pages', () => {
    const shell = readFileSync(new URL('../../code-style.html', import.meta.url), 'utf-8');
    const head = shell.slice(0, shell.indexOf('</head>'));
    expect(head).toContain("localStorage.getItem('lc-theme')");
    expect(head).toContain("classList.add('dark')");
    expect(shell).toContain('src="/src/code-style/main.tsx"');
  });
});
