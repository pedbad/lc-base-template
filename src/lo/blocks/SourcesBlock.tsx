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
 * NO STYLESHEET. `OutcomesBlock` is the precedent: utilities only, and only ones the
 * bundle already carries, because CSS headroom is near zero (docs/TOOLING.md).
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
    <li className="flex items-start gap-2">
      <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      {/* min-w-0: a long unbroken URL or title must wrap, not widen the row. */}
      <div className="min-w-0">
        <p>
          <span className="sr-only">{`${resolveLabel(LABEL_KEYS[item.kind])} `}</span>
          <RichText nodes={item.citation} />
        </p>
        {item.note === undefined ? null : (
          <p className="text-sm text-muted-foreground">
            <RichText nodes={item.note} />
          </p>
        )}
      </div>
    </li>
  );
}

export function SourcesBlock({ content, presentation = 'card' }: BlockRendererProps) {
  const { groups } = parseBlockContent('sources', SourcesBlockContentSchema, content);
  const Heading = presentation === 'plain' ? 'h3' : 'h4';

  return (
    <div className="grid gap-6 max-w-(--measure)">
      {groups.map((group, groupIndex) => (
        // Static config, never reordered at runtime, so the index is a stable key.
        <div key={groupIndex}>
          {group.heading === undefined ? null : (
            <Heading className="font-heading text-base font-semibold text-foreground">
              {group.heading}
            </Heading>
          )}
          <ul className="mt-3 grid gap-3">
            {group.items.map((item, itemIndex) => (
              <Source key={itemIndex} item={item} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
