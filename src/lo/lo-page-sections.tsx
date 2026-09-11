/**
 * lo-page-sections.tsx — the adapter: an assembled LO → the shell's `PageSection[]`.
 *
 * The one place JSON becomes DOM. It knows about both halves and nothing else knows
 * about both: `assembleLo` produces ordered, validated data with no React in it, and
 * `PageLayout` renders sections with no knowledge of LOs.
 *
 * Per section, in declared order: one `LoAccordion` per block, then one per exercise.
 * (Blocks before exercises mirrors the two on-disk folders the manifest keeps
 * separate.) Block bodies resolve through `getBlockRenderer`; exercise bodies mount
 * through `ExerciseHost`, which owns the instruction box and resolves the engine via
 * `lazyRegistry` — the same path the showcase uses, so the wiring is defined once.
 *
 * Accordion ids are namespaced by KIND (`block-01-grammar`, `exercise-01-select`).
 * Refs are unique per kind LO-wide, so this cannot collide with itself, and the
 * prefix keeps it out of the section-anchor namespace (`#grammar`) — which matters
 * because `headingId()` derives `{id}-heading` from both.
 *
 * Spec: docs/specs/lo-semantic-structure.md §1, §1a, §2, §3.
 */
import type { ReactNode } from 'react';
import InstructionsCallout from '@/components/shell/InstructionsCallout';
import LoAccordion from '@/components/shell/LoAccordion';
import type { PageSection } from '@/components/shell/PageLayout';
import { ExerciseHost } from '@/exercises/lib/ExerciseHost';
import type { AssembledLo, AssembledSection } from './assemble-lo';
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
function blockBody(config: AssembledSection['blocks'][number]['config']): ReactNode {
  const Renderer = getBlockRenderer(config.type);
  if (!Renderer) {
    return (
      <p className="text-destructive">
        No renderer registered for block type <code>{config.type}</code>.
      </p>
    );
  }
  return <Renderer content={config.content} />;
}

/** One section's blocks, then its exercises, each in declared order.
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
 * slot, and the field would otherwise render nowhere. */
function sectionContent(section: AssembledSection): ReactNode {
  return (
    <div className="space-y-3">
      {section.blocks.map(({ ref, config }) => {
        const instructions = readInstructions(config.content);

        if (config.presentation === 'plain') {
          return (
            <div key={`block-${ref}`}>
              {instructions === undefined ? null : (
                <InstructionsCallout className="mb-3">{instructions}</InstructionsCallout>
              )}
              {blockBody(config)}
            </div>
          );
        }

        return (
          <LoAccordion
            key={`block-${ref}`}
            id={`block-${ref}`}
            title={config.title ?? ''}
            instructions={instructions}
            defaultOpen={config.defaultOpen}
          >
            {blockBody(config)}
          </LoAccordion>
        );
      })}

      {section.exercises.map(({ ref, config }) => (
        <LoAccordion key={`exercise-${ref}`} id={`exercise-${ref}`} title={config.title}>
          {/* ExerciseHost renders the instruction box itself, so the accordion's own
              instructions slot stays empty here — one instruction box, not two. */}
          <ExerciseHost type={config.type} config={config} />
        </LoAccordion>
      ))}
    </div>
  );
}

/** Map an assembled LO to the ordered section list the shell renders. */
export function toPageSections(lo: AssembledLo): PageSection[] {
  return lo.sections.map((section) => ({
    id: section.id,
    label: section.label,
    ...(section.navLabel === undefined ? {} : { navLabel: section.navLabel }),
    content: sectionContent(section),
  }));
}
