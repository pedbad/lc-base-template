/**
 * ColourInUse — ③ of the brand board (§E19): the semantic layer shown as the UI it
 * paints, one panel per group in the catalog, so a preset or theme change shows its
 * real effect. Each panel's fold lists its tokens.css names — and, for a pair, the live
 * contrast between surface and text — so everything the old pair grid showed a
 * designer is still here.
 */
import type { ReactNode } from 'react';
import { FOCUS_OUTLINE } from '@/components/shell/focus-outline';
import {
  SEMANTIC_SWATCHES,
  SWATCH_STRIPS,
  type SemanticGroup,
  type StripGroup,
} from '../sandbox-catalog';
import { toHex } from './colour-math';
import { ContrastBadge, PLACEHOLDER } from './ContrastBadge';
import {
  ActionsSpecimen,
  ChartSpecimen,
  LinesSpecimen,
  SidebarSpecimen,
  StatesSpecimen,
  SurfacesSpecimen,
} from './in-use-specimens';
import type { LiveColours } from './live-colours';

interface ColourInUseProps {
  readonly live: LiveColours | null;
}

const SUMMARY_CLASS = `w-fit cursor-pointer rounded-sm ${FOCUS_OUTLINE}`;

function PairSpecimen({ group }: { readonly group: SemanticGroup }) {
  switch (group.specimen) {
    case 'surfaces':
      return <SurfacesSpecimen pairs={group.pairs} />;
    case 'actions':
      return <ActionsSpecimen pairs={group.pairs} />;
    case 'states':
      return <StatesSpecimen pairs={group.pairs} />;
    default:
      return <SidebarSpecimen pairs={group.pairs} />;
  }
}

function Panel({
  title,
  note,
  children,
}: {
  readonly title: string;
  readonly note: string;
  readonly children: ReactNode;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div>
        <h4 className="font-heading text-base font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{note}</p>
      </div>
      {children}
    </article>
  );
}

function PairPanel({
  group,
  live,
}: {
  readonly group: SemanticGroup;
  readonly live: LiveColours | null;
}) {
  return (
    <Panel title={group.title} note={group.note}>
      <div aria-hidden="true" data-slot="in-use-specimen">
        <PairSpecimen group={group} />
      </div>
      <details className="text-xs text-muted-foreground">
        <summary className={SUMMARY_CLASS}>Tokens</summary>
        <ul className="mt-2 flex flex-col gap-2">
          {group.pairs.map((pair) => (
            <li key={pair.token}>
              <code>{pair.token}</code> with <code>{pair.on}</code> — {pair.use}
              <ContrastBadge a={live?.get(pair.token)} b={live?.get(pair.on)} withName="its text" />
            </li>
          ))}
        </ul>
      </details>
    </Panel>
  );
}

function StripPanel({
  group,
  live,
}: {
  readonly group: StripGroup;
  readonly live: LiveColours | null;
}) {
  return (
    <Panel title={group.title} note={group.note}>
      <div aria-hidden="true" data-slot="in-use-specimen">
        {group.specimen === 'chart' ? (
          <ChartSpecimen tokens={group.tokens} />
        ) : (
          <LinesSpecimen tokens={group.tokens} />
        )}
      </div>
      <details className="text-xs text-muted-foreground">
        <summary className={SUMMARY_CLASS}>Tokens</summary>
        <ul className="mt-2 flex flex-col gap-1 font-mono">
          {group.tokens.map((token) => {
            const rgb = live?.get(token);
            return (
              <li key={token}>
                <code>{token}</code> {rgb ? toHex(rgb) : PLACEHOLDER}
              </li>
            );
          })}
        </ul>
      </details>
    </Panel>
  );
}

export function ColourInUse({ live }: ColourInUseProps) {
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      {SEMANTIC_SWATCHES.map((group) => (
        <PairPanel key={group.title} group={group} live={live} />
      ))}
      {SWATCH_STRIPS.map((group) => (
        <StripPanel key={group.title} group={group} live={live} />
      ))}
    </div>
  );
}
