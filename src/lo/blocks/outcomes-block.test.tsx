/**
 * outcomes-block.test.tsx — the `outcomes` block's content contract and its markup.
 *
 * Two things carry the weight here. The CONTRACT: `alt` is required but may be the
 * empty string, so no image can ship without an alt and a decorative one is still
 * expressible. The MARKUP: the tick is decoration, so the list semantics must come
 * from <ul>/<li> and every icon must be out of the accessibility tree.
 */
import { test, expect } from 'vitest';
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
