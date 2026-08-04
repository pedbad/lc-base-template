/**
 * lo-rich-text.test.ts — repo-wide guards over the rich text in EVERY LO.
 *
 * `assembleLo` checks modal-to-modal links at load, but block prose is parsed by its
 * per-type content schema at render, so links authored in a block cannot be checked
 * there. This closes that gap in CI (spec §5, §11) with two rules:
 *
 *   1. Every `data-modal-target` authored anywhere in an LO resolves to a modal that
 *      LO declares — no dead buttons.
 *   2. Every `data-audio` path is under `audio/<lo-slug>/` AND resolves to a real file
 *      in `public/` — mirroring `showcase-audio-assets.test.ts`, so real course audio
 *      never mixes with the demo clips quarantined under `audio/showcase-demo/`.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { listLoSlugs, loadLo } from '../load-lo-disk';
import { TextBlockContentSchema } from '../blocks/text-block-schema';
import { collectAudioPaths, collectModalTargets } from './rich-text-nodes';
import type { RichTextNode } from './rich-text-nodes';

const PUBLIC_DIR = path.resolve(import.meta.dirname, '../../../public');

/** Block types whose `content` carries inline rich text in `text[]`. */
const RICH_TEXT_BLOCK_TYPES = new Set(['prose', 'grammar']);

/**
 * Every rich-text paragraph in one LO — from its modals (already parsed by the
 * loader) and from its rich-text blocks (parsed here through the same schema the
 * renderer uses, so this sees exactly what the page will).
 */
function richTextOf(slug: string): readonly (readonly RichTextNode[])[] {
  const lo = loadLo(slug);

  const fromModals = Object.values(lo.modals).flatMap((modal) => modal.content);

  const fromBlocks = lo.sections
    .flatMap((section) => section.blocks)
    .filter(({ config }) => RICH_TEXT_BLOCK_TYPES.has(config.type))
    .flatMap(({ ref, config }) => {
      const result = TextBlockContentSchema.safeParse(config.content);
      if (!result.success) {
        throw new Error(`lo-config/${slug}/blocks/${ref}/block.json has invalid rich text`);
      }
      return result.data.text;
    });

  return [...fromModals, ...fromBlocks];
}

const SLUGS = listLoSlugs();

describe('every LO', () => {
  test('there is at least one LO to check, so these guards cannot pass vacuously', () => {
    expect(SLUGS.length).toBeGreaterThan(0);
  });

  test.each(SLUGS)('%s: every modal link resolves to a declared modal', (slug) => {
    const declared = Object.keys(loadLo(slug).modals);
    const targets = richTextOf(slug).flatMap(collectModalTargets);

    targets.forEach((target) => {
      expect(declared, `${slug} links to modal "${target}" but does not declare it`).toContain(
        target,
      );
    });
  });

  test.each(SLUGS)('%s: every audio path is namespaced under audio/<slug>/', (slug) => {
    richTextOf(slug)
      .flatMap(collectAudioPaths)
      .forEach((soundFile) => {
        expect(soundFile).toMatch(new RegExp(`^audio/${slug}/`));
      });
  });

  test.each(SLUGS)('%s: every audio path resolves to a real file in public/', (slug) => {
    richTextOf(slug)
      .flatMap(collectAudioPaths)
      .forEach((soundFile) => {
        const absolute = path.join(PUBLIC_DIR, soundFile);
        expect(existsSync(absolute), `${soundFile} does not exist in public/`).toBe(true);
      });
  });
});

describe('the example LO specifically', () => {
  test('declares a modal and links to it from block prose, so the popup is reachable', () => {
    const lo = loadLo('lo-00-example');
    expect(Object.keys(lo.modals)).toContain('example-popup');

    const targets = richTextOf('lo-00-example').flatMap(collectModalTargets);
    expect(targets).toContain('example-popup');
  });

  test('the modal carries an audio icon, not only text', () => {
    const modal = loadLo('lo-00-example').modals['example-popup'];
    expect(modal.content.flatMap(collectAudioPaths).length).toBeGreaterThan(0);
  });
});
