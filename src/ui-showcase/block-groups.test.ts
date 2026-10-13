/**
 * block-groups.test.ts — what the UI showcase shows (TODO §F4): every registered block
 * type, in both presentations, the example LO's own blocks first.
 */
import { describe, expect, it } from 'vitest';
import { BlockConfigSchema, type BlockConfig } from '@/config/lo-schema';
import { BLOCK_RENDERERS } from '@/lo/blocks/block-renderers';
import { loadLo } from '@/lo/load-lo-glob';
import { BLOCK_FIXTURES } from './block-fixtures';
import { EXAMPLE_LO_SLUG, buildBlockGroups, flipPresentation } from './block-groups';

const lo = loadLo(EXAMPLE_LO_SLUG);
const groups = buildBlockGroups(lo, BLOCK_FIXTURES);
const items = groups.flatMap((group) => group.items);

describe('buildBlockGroups', () => {
  it('has one group per registered block type, in registry order', () => {
    expect(groups.map((group) => group.type)).toEqual(Object.keys(BLOCK_RENDERERS));
  });

  // The point of the page: a reviewer sees each type as an object on the page AND as the
  // page talking, whichever one the example LO happens to use.
  it('shows every type in both presentations', () => {
    for (const group of groups) {
      const shown = new Set(group.items.map((item) => item.config.presentation));
      expect([...shown].sort(), group.type).toEqual(['card', 'plain']);
    }
  });

  it("puts the example LO's own blocks first, unchanged apart from opening cards", () => {
    const exampleBlocks = lo.sections.flatMap((section) => section.blocks);
    for (const { ref, config } of exampleBlocks) {
      const group = groups.find((candidate) => candidate.type === config.type);
      const item = group?.items.find((candidate) => candidate.caption.includes(`blocks/${ref}`));
      expect(item?.source, ref).toBe('example');
      expect(item?.config.content, ref).toBe(config.content);
      expect(item?.config.title, ref).toBe(config.title);
    }
    for (const group of groups) {
      const sources = group.items.map((item) => item.source);
      expect(sources, group.type).toEqual([...sources].sort(bySourceOrder));
    }
  });

  it('opens every card, so nothing on the page needs a click to be seen', () => {
    const cards = items.filter((item) => item.config.presentation === 'card');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((item) => item.config.defaultOpen)).toBe(true);
  });

  it('produces configs the LO schema accepts', () => {
    for (const item of items) {
      expect(BlockConfigSchema.safeParse(item.config).success, item.id).toBe(true);
    }
  });

  it('gives every item a unique id, distinct from every group id', () => {
    const ids = [...groups.map((group) => group.type), ...items.map((item) => item.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only reaches for an authored fixture where the example LO has no block of that type', () => {
    const exampleTypes = new Set(
      lo.sections.flatMap((section) => section.blocks.map(({ config }) => config.type)),
    );
    for (const fixture of BLOCK_FIXTURES) {
      expect(exampleTypes.has(fixture.config.type), fixture.id).toBe(false);
    }
  });
});

describe('flipPresentation', () => {
  const card: BlockConfig = BlockConfigSchema.parse({
    type: 'prose',
    title: 'A card',
    defaultOpen: true,
    content: { text: ['Body.'] },
  });

  it('turns a card plain, dropping the title and the open state a plain block cannot have', () => {
    const plain = flipPresentation(card, 'unused');
    expect(plain.presentation).toBe('plain');
    expect(plain.title).toBeUndefined();
    expect(plain.defaultOpen).toBe(false);
    expect(plain.content).toBe(card.content);
  });

  it('turns a plain block into an open card under the given title', () => {
    const flipped = flipPresentation(flipPresentation(card, 'unused'), 'Card title');
    expect(flipped.presentation).toBe('card');
    expect(flipped.title).toBe('Card title');
    expect(flipped.defaultOpen).toBe(true);
  });
});

const SOURCE_ORDER = ['example', 'fixture', 'variant'];

function bySourceOrder(a: string, b: string): number {
  return SOURCE_ORDER.indexOf(a) - SOURCE_ORDER.indexOf(b);
}
