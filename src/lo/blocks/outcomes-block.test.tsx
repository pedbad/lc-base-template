/**
 * outcomes-block.test.tsx — the `outcomes` block's content contract and its markup.
 *
 * Two things carry the weight here. The CONTRACT: `alt` is required but may be the
 * empty string, so no image can ship without an alt and a decorative one is still
 * expressible. The MARKUP: the tick is decoration, so the list semantics must come
 * from <ul>/<li> and every icon must be out of the accessibility tree.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { test, expect } from 'vitest';
import { getBlockRenderer } from './block-renderers';
import { OutcomesBlockContentSchema } from './outcomes-block-schema';

/** A minimal valid content object, spread-and-overridden per case. */
const valid = {
  lead: 'After completing this unit, you will be able to:',
  items: ['Greet someone formally.', 'Greet someone informally.'],
};

test('a list-only block parses — the image is optional', () => {
  const result = OutcomesBlockContentSchema.safeParse(valid);

  expect(result.success).toBe(true);
});

test('an image with alt text parses, and an empty alt is a valid decorative choice', () => {
  expect(
    OutcomesBlockContentSchema.safeParse({
      ...valid,
      image: { src: 'images/lo-placeholder.svg', alt: '' },
    }).success,
  ).toBe(true);

  expect(
    OutcomesBlockContentSchema.safeParse({
      ...valid,
      image: { src: 'images/two-people.svg', alt: 'Two people greeting each other' },
    }).success,
  ).toBe(true);
});

test('an image without alt is rejected, naming the field the author must fix', () => {
  const result = OutcomesBlockContentSchema.safeParse({
    ...valid,
    image: { src: 'images/lo-placeholder.svg' },
  });

  expect(result.success).toBe(false);
  // Narrow before reading `.error`: safeParse returns a discriminated union, so
  // `result.error?.` does not type-check and would fail `bun run lint`.
  if (result.success) throw new Error('expected a validation failure');
  // The path is what makes the failure actionable — "somewhere in this block" is not
  // a useful build error.
  expect(result.error.issues[0]?.path).toEqual(['image', 'alt']);
});

test('a blank lead and an empty outcome list are both rejected', () => {
  expect(OutcomesBlockContentSchema.safeParse({ ...valid, lead: '' }).success).toBe(false);
  expect(OutcomesBlockContentSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
});

test('authored strings arrive as parsed rich-text nodes, never as strings', () => {
  const parsed = OutcomesBlockContentSchema.parse({
    lead: 'You will be able to:',
    items: ['Use <em>je voudrais</em> politely.'],
  });

  // The no-raw-HTML contract: the renderer must receive a validated tree.
  expect(Array.isArray(parsed.lead)).toBe(true);
  expect(Array.isArray(parsed.items[0])).toBe(true);
  expect(JSON.stringify(parsed.items[0])).toContain('"em"');
});

/** Render the outcomes body through the registry, as the adapter does. */
function renderOutcomes(content: unknown): string {
  const Renderer = getBlockRenderer('outcomes');
  if (!Renderer) throw new Error('no renderer for "outcomes"');
  return renderToStaticMarkup(<Renderer content={content} />);
}

test('renders the lead as a <p> and one <li> per outcome, in authored order', () => {
  const html = renderOutcomes(valid);

  expect(html).toContain('<p');
  expect(html).toContain('After completing this unit, you will be able to:');
  expect(html).toContain('<ul');
  expect(html.match(/<li/g)).toHaveLength(2);
  expect(html.indexOf('Greet someone formally.')).toBeLessThan(
    html.indexOf('Greet someone informally.'),
  );
});

test('every tick is out of the accessibility tree — the list carries the semantics', () => {
  const html = renderOutcomes(valid);

  // Correlate the attribute to the ELEMENT, not two independent totals: a regression
  // that moved aria-hidden off a tick onto some other node would keep both counts.
  expect(html.match(/<svg[^>]*aria-hidden="true"/g)).toHaveLength(2);
  expect(html.match(/<svg/g)).toHaveLength(2);
});

test('a decorative image renders an empty alt AND is hidden from the tree', () => {
  const html = renderOutcomes({
    ...valid,
    image: { src: 'images/lo-placeholder.svg', alt: '' },
  });

  expect(html).toMatch(/<img[^>]*alt=""/);
  expect(html).toMatch(/<img[^>]*aria-hidden="true"/);
});

test('a meaningful image keeps its alt text and stays in the tree', () => {
  const html = renderOutcomes({
    ...valid,
    image: { src: 'images/two-people.svg', alt: 'Two people greeting each other' },
  });

  expect(html).toContain('alt="Two people greeting each other"');
  expect(html).not.toMatch(/<img[^>]*aria-hidden/);
});

test('the image src goes through resolveAsset, never the authored string', () => {
  // The fixture path deliberately has NO leading slash. A path that already starts
  // with the base short-circuits inside resolveAsset and comes back unchanged, so a
  // renderer that never called it at all would produce byte-identical markup and this
  // test would pass while proving nothing.
  const html = renderOutcomes({
    ...valid,
    image: { src: 'images/lo-placeholder.svg', alt: '' },
  });

  expect(html).toContain('src="/images/lo-placeholder.svg"');
  expect(html).not.toContain('src="images/lo-placeholder.svg"');
});

test('a list-only block renders no <img> at all', () => {
  expect(renderOutcomes(valid)).not.toContain('<img');
});

test('content that does not match the type fails loud, naming the type', () => {
  expect(() => renderOutcomes({ text: ['wrong shape'] })).toThrow(/outcomes/);
});
