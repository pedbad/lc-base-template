/**
 * PaletteAtAGlance — ① of the brand board (§E19): the palette in proportion, one
 * segment per primitive sized by its share, so a client sees how the course FEELS —
 * mostly paper and slate, Cambridge Blue prominent, accents as slivers — before any
 * single colour. Largest share first. Shares are catalog data, a design judgement.
 *
 * A list, not a picture: a screen reader hears "Paper, 39%" per segment. The legend
 * under the bar repeats the names for sighted readers, so it is hidden from the
 * accessibility tree to avoid reading them twice.
 *
 * SLANTED SEGMENTS (maintainer, 2026-10-16): each segment is a parallelogram with a
 * small gap, as a KWL chart draws its panels, so even a 2% accent reads as its own
 * shape. The skew pushes each segment's corners out by half its slant, so the bar has
 * side padding to keep the outer corners inside the page frame.
 */
import type { PrimitiveColour } from '../sandbox-catalog';
import { tokenValue } from './token-value';

interface PaletteAtAGlanceProps {
  readonly colours: readonly PrimitiveColour[];
}

export function PaletteAtAGlance({ colours }: PaletteAtAGlanceProps) {
  // Largest share first: a brand board leads with what dominates the page.
  const shared = colours
    .filter((colour) => colour.share !== undefined)
    .toSorted((a, b) => (b.share ?? 0) - (a.share ?? 0));
  const total = shared.reduce((sum, colour) => sum + (colour.share ?? 0), 0);
  const percent = (colour: PrimitiveColour) => Math.round(((colour.share ?? 0) / total) * 100);
  return (
    <figure className="mt-4">
      <ul
        aria-label="The palette at a glance, by share of the page"
        className="flex h-28 gap-1 px-4"
      >
        {shared.map((colour) => (
          <li
            key={colour.token}
            title={`${colour.name}, ${percent(colour)}%`}
            className="min-w-2 -skew-x-12 rounded-md border border-border"
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
        className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-base text-muted-foreground"
      >
        {shared.map((colour) => (
          <span key={colour.token} className="inline-flex items-center gap-2.5">
            <span
              className="size-5 shrink-0 rounded-full border border-border"
              style={{ background: tokenValue(colour.token) }}
            />
            {colour.name} <span className="tabular-nums">{percent(colour)}%</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
