/**
 * lo-page-sections.tsx — the adapter: an assembled LO → the shell's `PageSection[]`.
 *
 * The one place JSON becomes DOM. It knows about both halves and nothing else knows
 * about both: `assembleLo` produces ordered, validated data with no React in it, and
 * `PageLayout` renders sections with no knowledge of LOs.
 *
 * Per section, in declared order: one `LoAccordion` per block, then one per exercise.
 * (Blocks before exercises mirrors the two on-disk folders the manifest keeps
 * separate.) Block bodies render through `LoBlock` (which resolves `getBlockRenderer`); exercise bodies mount
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
import LoAccordion from '@/components/shell/LoAccordion';
import type { PageSection } from '@/components/shell/PageLayout';
import { ExerciseHost } from '@/exercises/lib/ExerciseHost';
import type { AssembledLo, AssembledSection } from './assemble-lo';
import { LoBlock } from './LoBlock';

/** One section's blocks, then its exercises, each in declared order. Each block renders
 * through `LoBlock`, which owns the plain/card branch. An exercise saves progress under
 * its LO and exercise folders (`lo-03-food/02-flashcards`). */
function sectionContent(section: AssembledSection, slug: string): ReactNode {
  return (
    <div className="space-y-3">
      {section.blocks.map(({ ref, config }) => (
        <LoBlock key={`block-${ref}`} id={`block-${ref}`} config={config} />
      ))}

      {section.exercises.map(({ ref, config }) => (
        <LoAccordion key={`exercise-${ref}`} id={`exercise-${ref}`} title={config.title}>
          {/* ExerciseHost renders the instruction box itself, so the accordion's own
              instructions slot stays empty here — one instruction box, not two. */}
          <ExerciseHost type={config.type} config={config} progressId={`${slug}/${ref}`} />
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
    content: sectionContent(section, lo.slug),
  }));
}
