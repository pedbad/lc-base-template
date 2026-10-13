/**
 * SourcesBlock — `type: "sources"`. A references list: citations grouped under
 * optional headings, each with a print or web icon and an optional extract note.
 *
 * HEADING LEVEL FOLLOWS PRESENTATION. A plain block renders straight under the
 * section's <h2>, so its group headings are <h3>; a card already has an <h3> in its
 * accordion summary, so they drop to <h4>. A fixed level would break the outline in
 * one of the two.
 *
 * THE ICON IS INFORMATION HERE, not decoration — print or web is the one fact the
 * citation text may not make obvious. So the svg is hidden and the same fact is
 * spoken as sr-only text before the citation; announcing an icon by its shape name
 * ("book") would say less.
 *
 * GROUPS AS CARDS, SIDE BY SIDE (maintainer, 2026-10-13). The groups flow into an
 * auto-fit grid — as many ~26rem columns as fit, one on a phone — instead of a single
 * reading-measure column that left most of the page empty. In a plain block each
 * group is a card; inside an accordion card it is not, since a card in a card is
 * noise. A primary rule under each heading, dividers between entries and the kind
 * icon in a tinted chip give the list the structure a run of citations lacks.
 *
 * NO STYLESHEET. `OutcomesBlock` is the precedent: utilities only. The CSS cap was
 * raised to 19 kB for this (docs/TOOLING.md, "Bundle budget").
 */
import { BookOpenIcon, Globe } from 'lucide-react';
import { resolveLabel } from '@/config/ui-strings';
import { RichText } from '../rich-text/RichText';
import type { BlockRendererProps } from './block-renderers';
import { parseBlockContent } from './parse-block-content';
import { SourcesBlockContentSchema, type SourceItem } from './sources-block-schema';

const ICONS = { print: BookOpenIcon, web: Globe } as const;
const LABEL_KEYS = { print: 'sourcePrint', web: 'sourceWeb' } as const;

function Source({ item }: { item: SourceItem }) {
  const Icon = ICONS[item.kind];
  return (
    <li className="flex items-start gap-3.5 py-3.5 first:pt-3 last:pb-0">
      <span
        aria-hidden="true"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      {/* min-w-0: a long unbroken URL or title must wrap, not widen the row. */}
      <div className="min-w-0">
        <p>
          <span className="sr-only">{`${resolveLabel(LABEL_KEYS[item.kind])} `}</span>
          <RichText nodes={item.citation} />
        </p>
        {item.note === undefined ? null : (
          <p className="mt-1.5 text-sm text-muted-foreground italic">
            <RichText nodes={item.note} />
          </p>
        )}
      </div>
    </li>
  );
}

export function SourcesBlock({ content, presentation = 'card' }: BlockRendererProps) {
  const { groups } = parseBlockContent('sources', SourcesBlockContentSchema, content);
  const isPlain = presentation === 'plain';
  const Heading = isPlain ? 'h3' : 'h4';

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,26rem),1fr))] items-start gap-6">
      {groups.map((group, groupIndex) => (
        // Static config, never reordered at runtime, so the index is a stable key.
        <div
          key={groupIndex}
          className={isPlain ? 'rounded-lg border bg-card px-6 py-5 shadow-sm' : undefined}
        >
          {group.heading === undefined ? null : (
            <Heading className="border-b-2 border-primary pb-3 font-heading text-lg font-semibold text-foreground">
              {group.heading}
            </Heading>
          )}
          <ul className="divide-y">
            {group.items.map((item, itemIndex) => (
              <Source key={itemIndex} item={item} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
