/**
 * UiShowcase.test.tsx — the UI showcase page (TODO §F4): every block type, grouped,
 * rendered through the course page's own `LoBlock`, under the shared debug header.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { findHeadingViolations } from '@/guards/semantic-dom';
import UiShowcase from './UiShowcase';
import { UI_SHOWCASE_GROUPS, UI_SHOWCASE_SECTIONS } from './ui-showcase-data';

const html = renderToStaticMarkup(<UiShowcase />);
const nav = /<nav[^>]*aria-label="UI showcase sections"[^>]*>.*?<\/nav>/s.exec(html)?.[0] ?? '';

describe('UI showcase nav', () => {
  test('offers one jump entry per block type, each landing on its section', () => {
    expect(nav).toMatch(/aria-haspopup="menu"[^>]*>[^<]*Jump to block type/);
    expect(UI_SHOWCASE_SECTIONS.map((section) => section.id)).toEqual(
      UI_SHOWCASE_GROUPS.map((group) => group.type),
    );
    UI_SHOWCASE_SECTIONS.forEach(({ id }) => {
      expect(html).toMatch(new RegExp(`<section[^>]*id="${id}"`));
    });
  });

  test('links to every debug page and course home, marking itself current', () => {
    ['exercise-showcase', 'debug-sandbox', 'ui-showcase', 'code-style', 'culp-syllabi'].forEach(
      (file) => {
        expect(nav).toContain(`href="/${file}.html"`);
      },
    );
    expect(nav.match(/aria-current="page"/g)).toHaveLength(1);
    expect(nav).toMatch(/<a [^>]*href="\/ui-showcase\.html"[^>]*aria-current="page"/);
    expect(nav).toContain('Course home');
  });
});

describe('UI showcase content', () => {
  test('heads each type with an h2 and captions every item with where it came from', () => {
    for (const group of UI_SHOWCASE_GROUPS) {
      expect(html).toMatch(new RegExp(`<h2[^>]*>${group.label}</h2>`));
      for (const item of group.items) {
        expect(html, item.id).toContain(`id="${item.id}"`);
        expect(html, item.id).toContain(item.caption);
      }
    }
  });

  test('renders every card under its own title, open', () => {
    const cards = UI_SHOWCASE_GROUPS.flatMap((group) => group.items).filter(
      (item) => item.config.presentation === 'card',
    );
    for (const card of cards) {
      // The accordion's own <details>: the nearest one before the card's heading. A
      // transcript disclosure inside a tab is a <details> too, closed by design.
      const accordion = new RegExp(
        `<details([^>]*)>(?:(?!<details).)*?<h3[^>]*id="block-${card.id}-heading"`,
        's',
      ).exec(html);
      expect(accordion, card.id).not.toBeNull();
      expect(accordion?.[1], card.id).toMatch(/\bopen\b/);
    }
  });

  test('resolves a renderer for every block, and skips no heading level', () => {
    expect(html).not.toContain('No renderer registered');
    expect(findHeadingViolations(html)).toEqual([]);
  });

  test('<main> is the shared page frame, with no width or gutter of its own', () => {
    const main = /<main class="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(main).toMatch(/\bpage-frame\b/);
    expect(main).not.toMatch(/\bmax-w-|\bpx-\d/);
  });
});

describe('ui-showcase.html', () => {
  test('applies the stored theme before first paint, like the other pages', () => {
    const shell = readFileSync(new URL('../../ui-showcase.html', import.meta.url), 'utf-8');
    const head = shell.slice(0, shell.indexOf('</head>'));
    expect(head).toContain("localStorage.getItem('lc-theme')");
    expect(head).toContain("classList.add('dark')");
    expect(shell).toContain('src="/src/ui-showcase/main.tsx"');
  });
});
