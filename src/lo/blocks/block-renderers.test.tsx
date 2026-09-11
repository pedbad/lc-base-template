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

test('a block whose content does not match its type fails loud, naming the type', () => {
  expect(() => renderBlock('vocabulary', { text: ['wrong shape'] })).toThrow(/vocabulary/);
});

test('an unregistered block type resolves to undefined for the caller to handle', () => {
  expect(getBlockRenderer('pronunciation')).toBeUndefined();
});
