/**
 * in-use-specimens — the drawings in ③ of the brand board (§E19), one per
 * `SpecimenKind`. Each paints the catalog's tokens as the UI they colour: nested
 * surfaces, buttons, answer feedback, a sidebar, inputs and rings, a chart. All of it
 * is decorative — spans and divs, no control — and the caller hides it from screen
 * readers; the token fold beside it carries the same facts as text.
 */
import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, CircleX, Info, Volume2 } from 'lucide-react';
// A separate type import: app-assets.test.ts reads every name in a braced lucide-react
// value import as an icon, `type LucideIcon` included.
import type { LucideIcon } from 'lucide-react';
import type { SemanticPair } from '../sandbox-catalog';
import { tokenValue } from './token-value';

const paint = (pair: SemanticPair) => ({
  background: tokenValue(pair.token),
  color: tokenValue(pair.on),
});

/** Page ⊃ card ⊃ popover: each pair nested in the one before, as the course stacks them. */
export function SurfacesSpecimen({ pairs }: { readonly pairs: readonly SemanticPair[] }) {
  return pairs.reduceRight<ReactNode>(
    (inner, pair) => (
      <div className="rounded-lg border border-border p-3 text-sm" style={paint(pair)}>
        <p>{pair.use}</p>
        {inner && <div className="mt-2">{inner}</div>}
      </div>
    ),
    null,
  );
}

/** Each action pair as a button-shaped label, the first also as an icon-only one. */
export function ActionsSpecimen({ pairs }: { readonly pairs: readonly SemanticPair[] }) {
  const [first] = pairs;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {pairs.map((pair) => (
        <span
          key={pair.token}
          className="rounded-lg px-3 py-1.5 text-sm font-medium"
          style={paint(pair)}
        >
          {pair.use}
        </span>
      ))}
      {first && (
        <span
          className="inline-flex size-8 items-center justify-center rounded-lg"
          style={paint(first)}
        >
          <Volume2 className="size-4" />
        </span>
      )}
    </div>
  );
}

const STATE_ICONS: Readonly<Record<string, LucideIcon>> = {
  '--success': CircleCheck,
  '--destructive': CircleX,
  '--warning': CircleAlert,
};

/** The feedback a learner sees, one chip per state. */
export function StatesSpecimen({ pairs }: { readonly pairs: readonly SemanticPair[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {pairs.map((pair) => {
        const Icon = STATE_ICONS[pair.token] ?? Info;
        return (
          <span
            key={pair.token}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
            style={paint(pair)}
          >
            <Icon className="size-4" />
            {pair.use}
          </span>
        );
      })}
    </div>
  );
}

/** The sidebar surface holding its action and its hover row. */
export function SidebarSpecimen({ pairs }: { readonly pairs: readonly SemanticPair[] }) {
  const [surface, ...rows] = pairs;
  if (!surface) return null;
  return (
    <div
      className="flex max-w-60 flex-col gap-1 rounded-lg border border-border p-2 text-sm"
      style={paint(surface)}
    >
      <span className="px-2 py-1">{surface.use}</span>
      {rows.map((pair) => (
        <span key={pair.token} className="rounded-md px-2 py-1" style={paint(pair)}>
          {pair.use}
        </span>
      ))}
    </div>
  );
}

/** Lines as bordered fields, rings as a focus outline: what each token draws. */
export function LinesSpecimen({ tokens }: { readonly tokens: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {tokens.map((token) =>
        token.endsWith('ring') ? (
          <span
            key={token}
            className="h-9 w-32 rounded-md border border-border bg-card outline-2 outline-offset-2 outline-solid"
            style={{ outlineColor: tokenValue(token) }}
          />
        ) : (
          <span
            key={token}
            className="h-9 w-32 rounded-md border-2 bg-card"
            style={{ borderColor: tokenValue(token) }}
          />
        ),
      )}
    </div>
  );
}

/** Bar heights for the mini chart, cycling: a chart shape, not data. */
const BAR_HEIGHTS = ['h-8', 'h-14', 'h-10', 'h-16', 'h-12'] as const;

/** The five chart slots, in slot order, as a small bar chart. */
export function ChartSpecimen({ tokens }: { readonly tokens: readonly string[] }) {
  return (
    <div className="flex h-16 items-end gap-2">
      {tokens.map((token, index) => (
        <span
          key={token}
          className={`w-8 rounded-t-sm ${BAR_HEIGHTS[index % BAR_HEIGHTS.length]}`}
          style={{ background: tokenValue(token) }}
        />
      ))}
    </div>
  );
}
