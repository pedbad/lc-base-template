/**
 * LoBlock.tsx — one block as the course page renders it.
 *
 * Extracted from `lo-page-sections.tsx` on 2026-10-13 so the UI showcase (TODO §F4)
 * renders a block through exactly this path rather than a copy of it.
 *
 * A block is an OBJECT ON THE PAGE or THE PAGE TALKING, and `presentation` picks
 * which. `card` wraps it in `LoAccordion`; `plain` wraps it in nothing at all.
 *
 * THE BRANCH IS HERE, NOT INSIDE LoAccordion, because the accordion's three jobs are
 * one object in this repo — the disclosure, the bordered surface and the `<h3>` — and
 * a plain block wants none of them. french switches a Card's surface off with
 * `transparentCard`; there is no separate Card here, and passing a disclosure
 * component a flag telling it not to be a disclosure would be the wrong seam.
 *
 * THE PLAIN BRANCH CARRIES NO HORIZONTAL PADDING, which was a decision made by
 * looking at both. Matching the accordion's `px-4` lines a plain block's text up with
 * every carded block's TEXT, and is what french does — its Card is still there,
 * padding and all, with only the surface switched off. Rendered side by side it still
 * read as a panel with its walls removed. Flush puts the prose on the same left edge
 * as the section's own `<h2>` and the cards' outer edges, and lets it use the full
 * column, which is what makes an introduction read as the page talking rather than as
 * one more object on it. The trade is real and was accepted: the intro's text no
 * longer shares an edge with the block text beneath it.
 *
 * Instructions are rendered here too: without the accordion there is no instructions
 * slot, and the field would otherwise render nowhere.
 */
import type { ReactNode } from 'react';
import InstructionsCallout from '@/components/shell/InstructionsCallout';
import LoAccordion from '@/components/shell/LoAccordion';
import type { BlockConfig } from '@/config/lo-schema';
import { getBlockRenderer } from './blocks/block-renderers';

/**
 * Read `content.instructions` off a block's loose content. Instructions are the ONE
 * shared field usable at section and accordion level (spec §3), so they are lifted
 * here into LoAccordion's instructions slot rather than re-rendered per block type.
 */
function readInstructions(content: unknown): string | undefined {
  if (typeof content !== 'object' || content === null) return undefined;
  const value = (content as { instructions?: unknown }).instructions;
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** A block's body, or a visible complaint if its `type` has no renderer. */
function blockBody(config: BlockConfig): ReactNode {
  const Renderer = getBlockRenderer(config.type);
  if (!Renderer) {
    return (
      <p className="text-destructive">
        No renderer registered for block type <code>{config.type}</code>.
      </p>
    );
  }
  return <Renderer content={config.content} presentation={config.presentation} />;
}

interface LoBlockProps {
  /** The accordion's id (a plain block has none). */
  id: string;
  config: BlockConfig;
}

export function LoBlock({ id, config }: LoBlockProps) {
  const instructions = readInstructions(config.content);

  if (config.presentation === 'plain') {
    return (
      <div>
        {instructions === undefined ? null : (
          <InstructionsCallout className="mb-3">{instructions}</InstructionsCallout>
        )}
        {blockBody(config)}
      </div>
    );
  }

  return (
    <LoAccordion
      id={id}
      title={config.title ?? ''}
      instructions={instructions}
      defaultOpen={config.defaultOpen}
    >
      {blockBody(config)}
    </LoAccordion>
  );
}
