/**
 * PaletteSection — the sandbox's Colour section, as a brand board (§E19; it began as
 * buildlist 16's swatch grids). Written for a client first and a designer second:
 *
 *   ① At a glance — the palette in proportion (PaletteAtAGlance)
 *   ② The colours — a card per primitive: name, job, live values, contrast (ColourCard)
 *   ③ In use      — each semantic role as the UI it paints (ColourInUse)
 *
 * Token names, which a designer edits, sit in each card's and panel's fold.
 *
 * NAMES HERE, VALUES FROM THE PAGE. The catalog holds names only; one `useLiveColours`
 * call reads every colour the board shows after hydration, and again on a theme or
 * preset change, so nothing on it can be stale. Before that — the prerender — every
 * value reads "—".
 */
import { ColourCard } from './palette/ColourCard';
import { ColourInUse } from './palette/ColourInUse';
import { PaletteAtAGlance } from './palette/PaletteAtAGlance';
import { useLiveColours } from './palette/useLiveColours';
import { PRIMITIVE_SWATCHES, SEMANTIC_SWATCHES, SWATCH_STRIPS } from './sandbox-catalog';

const PRIMITIVES = PRIMITIVE_SWATCHES.flatMap((group) => group.colours);
const NAME_BY_TOKEN = new Map(PRIMITIVES.map((colour) => [colour.token, colour.name]));

/** Every token the board reads, once each. */
const LIVE_TOKENS = [
  ...new Set([
    ...PRIMITIVES.map((colour) => colour.token),
    ...SEMANTIC_SWATCHES.flatMap((group) => group.pairs.flatMap((pair) => [pair.token, pair.on])),
    ...SWATCH_STRIPS.flatMap((group) => group.tokens),
  ]),
];

const PART_HEADING = 'mt-10 font-heading text-xl font-semibold';

export default function PaletteSection() {
  const live = useLiveColours(LIVE_TOKENS);
  return (
    <section aria-labelledby="palette-heading" className="scroll-mt-8" id="palette">
      <h2 id="palette-heading" className="font-heading text-2xl font-bold">
        Colour
      </h2>
      <p className="mt-2 max-w-(--measure) text-muted-foreground">
        The course is mostly calm paper and slate, with Cambridge Blue as the brand and a few
        accents for feedback and charts. Every value, contrast check and sample below is read from
        the page as it is now, so the theme switch and the preset picker change all of it.
      </p>

      <h3 className={PART_HEADING}>At a glance</h3>
      <PaletteAtAGlance colours={PRIMITIVES} />

      <h3 className={PART_HEADING}>The colours</h3>
      {PRIMITIVE_SWATCHES.map((group) => (
        <article key={group.title} className="mt-6">
          <h4 className="font-heading text-lg font-semibold">{group.title}</h4>
          <p className="max-w-(--measure) text-sm text-muted-foreground">{group.note}</p>
          <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
            {group.colours.map((colour) => (
              <ColourCard
                key={colour.token}
                colour={colour}
                partnerName={NAME_BY_TOKEN.get(colour.partner) ?? colour.partner}
                live={live}
              />
            ))}
          </ul>
        </article>
      ))}

      <h3 className={PART_HEADING}>In use</h3>
      <p className="mt-2 max-w-(--measure) text-sm text-muted-foreground">
        What lessons actually paint with. These are the meanings in{' '}
        <code>src/styles/tokens.css</code>; each one points at a colour above, and a preset changes
        which.
      </p>
      <ColourInUse live={live} />
    </section>
  );
}
