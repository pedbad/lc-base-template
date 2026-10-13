/**
 * block-groups.ts — what the UI showcase renders, as plain data (TODO §F4).
 *
 * One group per block type in `BLOCK_RENDERERS`, in registry order, so a newly
 * registered type appears on the page without anyone editing it. Inside a group:
 *
 *   1. every block of that type in the example LO, as authored (`example`);
 *   2. any authored fixture of that type (`fixture`) — only for a type the example LO
 *      lacks, see block-fixtures.ts;
 *   3. for each presentation still missing, the first item above flipped to it
 *      (`variant`). No new content: the same `content` object, plain ↔ card.
 *
 * So every type is seen both as an object on the page (`card`) and as the page talking
 * (`plain`). Every card is OPEN: a showcase whose content hides behind clicks shows
 * nothing at a glance. That is the one change made to an example block.
 */
import type { BlockConfig } from '@/config/lo-schema';
import { BLOCK_RENDERERS } from '@/lo/blocks/block-renderers';
import type { AssembledLo } from '@/lo/assemble-lo';
import type { BlockFixture } from './block-fixtures';

/** The LO whose blocks the showcase renders first. */
export const EXAMPLE_LO_SLUG = 'lo-00-example';

const PRESENTATIONS = ['plain', 'card'] as const;

export interface BlockShowcaseItem {
  /** Unique on the page. */
  readonly id: string;
  readonly source: 'example' | 'fixture' | 'variant';
  /** Where the item comes from, shown above it. */
  readonly caption: string;
  readonly config: BlockConfig;
}

export interface BlockShowcaseGroup {
  /** The block `type`; also the group's anchor. */
  readonly type: string;
  readonly label: string;
  readonly items: readonly BlockShowcaseItem[];
}

/**
 * The same block in its other presentation. Plain → card gains `title` and opens;
 * card → plain loses both, since a plain block has no accordion (lo-schema.ts rejects
 * a title or `defaultOpen: true` on one).
 */
export function flipPresentation(config: BlockConfig, cardTitle: string): BlockConfig {
  return config.presentation === 'card'
    ? { ...config, presentation: 'plain', title: undefined, defaultOpen: false }
    : { ...config, presentation: 'card', title: cardTitle, defaultOpen: true };
}

function opened(config: BlockConfig): BlockConfig {
  return config.presentation === 'card' ? { ...config, defaultOpen: true } : config;
}

function labelFor(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function groupFor(
  type: string,
  lo: AssembledLo,
  fixtures: readonly BlockFixture[],
): BlockShowcaseGroup {
  const label = labelFor(type);
  const examples: BlockShowcaseItem[] = lo.sections.flatMap((section) =>
    section.blocks
      .filter(({ config }) => config.type === type)
      .map(({ ref, config }) => ({
        id: `ui-${ref}`,
        source: 'example' as const,
        caption: `${lo.slug} · blocks/${ref} · ${config.presentation}`,
        config: opened(config),
      })),
  );
  const authored: BlockShowcaseItem[] = fixtures
    .filter((fixture) => fixture.config.type === type)
    .map((fixture) => ({ ...fixture, source: 'fixture' as const, config: opened(fixture.config) }));

  const shown = [...examples, ...authored];
  const base = shown[0];
  const variants: BlockShowcaseItem[] =
    base === undefined
      ? []
      : PRESENTATIONS.filter((presentation) =>
          shown.every((item) => item.config.presentation !== presentation),
        ).map((presentation) => ({
          id: `${base.id}-${presentation}`,
          source: 'variant' as const,
          caption: `${presentation} variant of ${base.caption.split(' · ').slice(0, 2).join(' · ')}`,
          config: flipPresentation(base.config, `${label} block, card presentation`),
        }));

  return { type, label, items: [...shown, ...variants] };
}

/** Every registered block type, each with its example, fixture and variant items. */
export function buildBlockGroups(
  lo: AssembledLo,
  fixtures: readonly BlockFixture[],
): BlockShowcaseGroup[] {
  return Object.keys(BLOCK_RENDERERS).map((type) => groupFor(type, lo, fixtures));
}
