/**
 * block-renderers.test.tsx — the block body renderers and the `type` → renderer map.
 *
 * Exercises resolve through `lazyRegistry`; blocks resolve through this map. The
 * checks that matter are the same two: the right body markup, and the right `lang`
 * on target-language content only (WCAG 3.1.2, spec §3).
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { test, expect } from 'vitest';
import { getBlockRenderer } from './block-renderers';

/** Render one block body through the registry, as the adapter does. */
function renderBlock(type: string, content: unknown): string {
  const Renderer = getBlockRenderer(type);
  if (!Renderer) throw new Error(`no renderer for "${type}"`);
  return renderToStaticMarkup(<Renderer content={content} />);
}

test('prose block renders one <p> per paragraph, in UI language', () => {
  const html = renderBlock('prose', { text: ['First para.', 'Second para.'] });

  expect(html).toContain('<p');
  expect(html).toContain('First para.');
  expect(html).toContain('Second para.');
  // Introduction/commentary prose is UI-language chrome — no lang switch.
  expect(html).not.toContain('lang=');
});

test('intro block carries a leading-edge rule, and is not a <blockquote>', () => {
  const html = renderBlock('intro', { text: ['Opening paragraph.'] });

  expect(html).toContain('Opening paragraph.');
  expect(html).toContain('<p');
  // The rule is a border on a plain wrapper. It is styled like a pull quote and is
  // NOT one — the text is the page's own voice, so announcing a quotation would be a
  // lie to a screen reader.
  expect(html).not.toContain('<blockquote');
  expect(html).toMatch(/class="[^"]*border-s-4/);
  // Same UI language as `prose`: the rule is decoration, not a change of meaning.
  expect(html).not.toContain('lang=');
});

test('grammar block wraps its examples in the target language', () => {
  const html = renderBlock('grammar', { text: ['Yo soy de Madrid.'] });

  expect(html).toContain('lang="es"');
  expect(html).toContain('Yo soy de Madrid.');
});

test('vocabulary block renders a <dl>, term in target language and gloss in UI language', () => {
  const html = renderBlock('vocabulary', {
    items: [{ term: 'buenos días', gloss: 'good morning' }],
  });

  expect(html).toContain('<dl');
  expect(html).toContain('<dt');
  expect(html).toContain('<dd');
  expect(html).toMatch(/<dt[^>]*lang="es"/);
  expect(html).toContain('buenos días');
  expect(html).toContain('good morning');
  expect(html).not.toMatch(/<dd[^>]*lang="es"/);
});

test('a vocabulary term can carry a clip, rendered beside the word it belongs to', () => {
  const html = renderBlock('vocabulary', {
    items: [{ term: 'buenos días', gloss: 'good morning', audio: 'audio/x.m4a' }],
  });

  // Inside the <dt>, not a column of its own: a control separated from the word it
  // plays is meaningless to anyone navigating by element.
  expect(html).toMatch(/<dt[^>]*>[\s\S]*<button[\s\S]*<\/dt>/);
  // And BEFORE the word, so every row shares one left edge to scan and click.
  //
  // Compared by POSITION, not by a `<button>.*term` pattern: the term also appears
  // inside the button's own aria-label ("Listen: buenos días"), so such a pattern
  // matches whichever order the markup is in — verified, it did. The last occurrence
  // of the term is the visible text; if it falls after </button> the clip came first.
  expect(html.indexOf('</button>')).toBeLessThan(html.lastIndexOf('buenos días'));
  // Named by the term. "Play" alone would be identical on every row of the list.
  expect(html).toContain('buenos días');
  expect(html).toMatch(/aria-label="[^"]*buenos días/);
  // NOT asserting the resolved URL here: the speaker is a <button> that plays through
  // AudioManager on click, so the path is never in static markup. Guard d is what
  // proves the file behind `audio` exists, and AudioClip owns resolveAsset.
});

test('only a row with a clip offers the pointer and hover — no empty promise', () => {
  const withAudio = renderBlock('vocabulary', {
    items: [{ term: 'buenos días', gloss: 'good morning', audio: 'audio/x.m4a' }],
  });
  const without = renderBlock('vocabulary', {
    items: [{ term: 'buenos días', gloss: 'good morning' }],
  });

  expect(withAudio).toContain('cursor-pointer');
  // A pointer over a row that does nothing is a promise the page cannot keep.
  expect(without).not.toContain('cursor-pointer');
  // The row is a MOUSE affordance only: no role and no tabIndex, so it never enters
  // the accessibility tree. The speaker <button> inside is the keyboard path, and
  // giving the row a role too would tab-stop and announce every word twice.
  expect(withAudio).not.toMatch(/<div[^>]*role="button"/);
  expect(withAudio).not.toMatch(/<div[^>]*tabindex/i);
});

test('a vocabulary term without a clip renders no audio control at all', () => {
  const html = renderBlock('vocabulary', {
    items: [{ term: 'buenos días', gloss: 'good morning' }],
  });

  expect(html).not.toContain('<button');
});

test('a block whose content does not match its type fails loud, naming the type', () => {
  expect(() => renderBlock('vocabulary', { text: ['wrong shape'] })).toThrow(/vocabulary/);
});

test('an unregistered block type resolves to undefined for the caller to handle', () => {
  expect(getBlockRenderer('pronunciation')).toBeUndefined();
});

// §D11 follow-up (maintainer, 2026-10-06): the intro is the page talking, and held to
// the 60ch measure it left an empty band beside it, above the outcomes image. It spans
// the column; other prose keeps the measure.
test('intro block opts out of the reading measure; prose does not', () => {
  expect(renderBlock('intro', { text: ['Opening.'] })).toMatch(
    /^<div class="[^"]*\brich-text-full\b/,
  );
  expect(renderBlock('prose', { text: ['Commentary.'] })).not.toContain('rich-text-full');
});
