/**
 * HoverTerm.test.tsx — the markup of a hover term and its card (TODO §D17). Closed on
 * the server and on first render, so the prerendered page equals the first client
 * render (AGENTS.md hard constraint 4). A disclosure: a button with aria-expanded and
 * aria-controls, the card right after it in reading order.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { HoverProvider } from './hover-context';
import { HoverTerm } from './HoverTerm';

const hovers = {
  'lo-json': {
    id: 'lo-json',
    title: 'Where this page comes from',
    path: 'lo-config/lo-00-example/lo.json',
    content: [[{ kind: 'text', value: 'Sections, in order.' }]],
  },
} as const;

const render = (defaultOpen = false) =>
  renderToStaticMarkup(
    <HoverProvider hovers={hovers}>
      <HoverTerm target="lo-json" defaultOpen={defaultOpen}>
        <>Learning Object&apos;s JSON</>
      </HoverTerm>
    </HoverProvider>,
  );

describe('HoverTerm', () => {
  test('closed: a collapsed button, and no card (nor aria-controls pointing at one)', () => {
    const html = render();

    expect(html).toMatch(
      /<button type="button" class="hover-term" aria-expanded="false">Learning Object(?:'|&#x27;)s JSON<\/button>/,
    );
    expect(html).not.toContain('hover-card"');
  });

  test('open: title, the tree (hidden from screen readers), the path in words, the text', () => {
    const html = render(true);

    expect(html).toMatch(
      /aria-expanded="true" aria-controls="([^"]+)"[\s\S]*id="\1" class="hover-card"/,
    );
    expect(html).toContain('Where this page comes from');
    expect(html).toMatch(/class="hover-card-tree" aria-hidden="true"/);
    expect(html).toContain('└── lo-00-example/');
    expect(html).toMatch(/<code[^>]*>lo-config\/lo-00-example\/lo\.json<\/code>/);
    expect(html).toContain('Sections, in order.');
  });

  test('the card is a span, never a block element: it sits inside a paragraph', () => {
    const card = /<span[^>]*class="hover-card"[\s\S]*$/.exec(render(true))?.[0] ?? '';
    expect(card).not.toMatch(/<(div|p|ul|table|pre)\b/);
  });
});
