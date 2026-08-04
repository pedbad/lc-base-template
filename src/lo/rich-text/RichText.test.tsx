/**
 * RichText.test.tsx — nodes → DOM. The load-bearing assertions are the two that
 * encode design decisions rather than markup: a modal link renders a BUTTON (spec §7)
 * and an audio node mounts a real AudioClip rather than inert markup (spec §6).
 *
 * `renderToStaticMarkup` (node env, no DOM) matches the rest of the suite. Dialog
 * open/close behaviour is Base UI's and is verified in the browser, not here — see
 * spec §11.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RichText } from './RichText';
import { parseRichText } from './parse-rich-text';
import { ModalProvider } from './modal/ModalProvider';
import type { RichTextNode } from './rich-text-nodes';

/** Render nodes inside a provider, since a modal link needs the context. */
function render(nodes: readonly RichTextNode[]): string {
  return renderToStaticMarkup(
    <ModalProvider modals={{}}>
      <RichText nodes={nodes} />
    </ModalProvider>,
  );
}

/** Parse then render, the way the loader + page do it end to end. */
function renderAuthored(html: string): string {
  return render(parseRichText(html));
}

describe('text and emphasis', () => {
  test('renders plain text', () => {
    expect(renderAuthored('Bonjour')).toContain('Bonjour');
  });

  test('renders strong and em as their semantic elements', () => {
    const html = renderAuthored('<strong>a</strong> and <em>b</em>');
    expect(html).toContain('<strong>a</strong>');
    expect(html).toContain('<em>b</em>');
  });

  test('renders nested emphasis', () => {
    expect(renderAuthored('<strong>x <em>y</em></strong>')).toContain(
      '<strong>x <em>y</em></strong>',
    );
  });

  test('renders a line break', () => {
    expect(renderAuthored('a<br>b')).toContain('a<br/>b');
  });

  test('escapes text that looked like markup in the source', () => {
    const html = renderAuthored('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('modal links', () => {
  test('renders a button, never an anchor (spec §7)', () => {
    const html = renderAuthored('<a class="modal-link" data-modal-target="tuvous">vous</a>');
    expect(html).toContain('<button');
    expect(html).toContain('vous');
    expect(html).not.toContain('<a ');
  });

  test('carries no href, so there is no fake fragment to report as broken', () => {
    const html = renderAuthored(
      '<a class="modal-link" href="#content" data-modal-target="tuvous">vous</a>',
    );
    expect(html).not.toContain('href');
  });

  test('is an explicit type="button" so it never submits a surrounding form', () => {
    const html = renderAuthored('<a class="modal-link" data-modal-target="t">v</a>');
    expect(html).toContain('type="button"');
  });
});

describe('audio icons', () => {
  test('mounts an AudioClip speaker rather than inert markup', () => {
    const html = renderAuthored('<span data-audio="audio/lo-00-example/tu.mp3"></span>');
    // The speaker is a real control, not a static glyph: it renders a button with an
    // accessible name. The clip path is deliberately absent from the initial markup —
    // AudioManager loads it on click, so nothing is fetched until the user asks.
    expect(html).toContain('super-compact-speaker');
    expect(html).toContain('<button');
    expect(html).toContain('aria-label="Click to play"');
  });

  test('uses data-audio-label as the accessible name when authored', () => {
    const html = renderAuthored(
      '<span data-audio="a.mp3" data-audio-label="Play tu, informal"></span>',
    );
    expect(html).toContain('aria-label="Play tu, informal"');
  });

  test('renders an audio icon inside emphasis', () => {
    const html = renderAuthored('<strong>tu <span data-audio="a.mp3"></span></strong>');
    expect(html).toContain('<strong>');
    expect(html).toContain('super-compact-speaker');
  });
});

describe('empty input', () => {
  test('renders nothing for an empty node list', () => {
    expect(render([])).not.toContain('undefined');
  });
});
