/**
 * PaletteAtAGlance — ① of the brand board (§E19): the palette in proportion, one
 * segment per primitive sized by its share, so a client sees how the course FEELS —
 * mostly paper and slate, Cambridge Blue prominent, accents as slivers — before any
 * single colour. Shares are catalog data, a design judgement.
 *
 * A list, not a picture: a screen reader hears "Paper, 39%" per segment. The legend
 * under the bar repeats the names for sighted readers, so it is hidden from the
 * accessibility tree to avoid reading them twice.
 */
import type { PrimitiveColour } from '../sandbox-catalog';
import { tokenValue } from './token-value';

interface PaletteAtAGlanceProps {
  readonly colours: readonly PrimitiveColour[];
}

export function PaletteAtAGlance({ colours }: PaletteAtAGlanceProps) {
  const shared = colours.filter((colour) => colour.share !== undefined);
  const total = shared.reduce((sum, colour) => sum + (colour.share ?? 0), 0);
  const percent = (colour: PrimitiveColour) => Math.round(((colour.share ?? 0) / total) * 100);
  return (
    <figure className="mt-4">
      <ul
        aria-label="The palette at a glance, by share of the page"
        className="flex h-20 overflow-hidden rounded-xl border border-border"
      >
        {shared.map((colour) => (
          <li
            key={colour.token}
            title={`${colour.name}, ${percent(colour)}%`}
            className="min-w-1"
            style={{ flexGrow: colour.share, background: tokenValue(colour.token) }}
          >
            <span className="sr-only">
              {colour.name}, {percent(colour)}%
            </span>
          </li>
        ))}
      </ul>
      <figcaption
        aria-hidden="true"
        className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"
      >
        {shared.map((colour) => (
          <span key={colour.token} className="inline-flex items-center gap-2">
            <span
              className="size-3 rounded-full border border-border"
              style={{ background: tokenValue(colour.token) }}
            />
            {colour.name} <span className="tabular-nums">{percent(colour)}%</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
