/**
 * PaletteSection — the colour half of the sandbox (buildlist 16).
 *
 * Every square's colour comes from `var(--token)` at render time, so this page shows
 * whatever `palette.css` and `tokens.css` currently hold. Nothing here knows a value,
 * which is what makes it safe to read as a reference: it cannot be stale.
 *
 * INLINE `style` RATHER THAN A STYLESHEET, deliberately. A `.swatch-primary { … }` rule
 * per token would be 30-odd near-identical rules in a new stylesheet for guards f and g
 * to police, and it would have to be edited every time a token is added. The token name
 * is DATA here (see sandbox-catalog.ts), so the only way to render it is to interpolate
 * it — and `var()` keeps the no-raw-hex rule intact, which is what those guards protect.
 */
import {
  PRIMITIVE_SWATCHES,
  SEMANTIC_SWATCHES,
  SWATCH_STRIPS,
  type SemanticPair,
} from './sandbox-catalog';

/** `--slate-2` → `var(--slate-2)`, the only value shape this file produces. */
const tokenValue = (token: string) => `var(${token})`;

function PrimitiveSwatch({ token }: { readonly token: string }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className="size-10 shrink-0 rounded-md border border-border"
        style={{ background: tokenValue(token) }}
        aria-hidden="true"
      />
      <code className="text-sm">{token}</code>
    </li>
  );
}

function SemanticSwatch({ pair }: { readonly pair: SemanticPair }) {
  return (
    <li className="overflow-hidden rounded-md border border-border">
      <div
        className="px-4 py-5"
        style={{ background: tokenValue(pair.token), color: tokenValue(pair.on) }}
      >
        <p className="text-sm font-semibold">{pair.use}</p>
        <p className="mt-1 text-sm">The quick brown fox jumps over the lazy dog.</p>
      </div>
      <div className="flex flex-wrap gap-x-4 bg-card px-4 py-2 text-xs text-muted-foreground">
        <code>{pair.token}</code>
        <code>{pair.on}</code>
      </div>
    </li>
  );
}

export default function PaletteSection() {
  return (
    <section aria-labelledby="palette-heading" className="scroll-mt-8" id="palette">
      <h2 id="palette-heading" className="font-heading text-2xl font-bold">
        Colour
      </h2>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Three layers, and only the first holds real values. Edit a primitive and every semantic
        token, component and page below it follows — that is the one-file re-skin DESIGNER.md
        describes. Toggle the theme above to see the semantic layer flip.
      </p>

      <h3 className="mt-8 font-heading text-lg font-semibold">
        Layer 1 — primitives (<code className="text-base">src/styles/palette.css</code>)
      </h3>
      {PRIMITIVE_SWATCHES.map((group) => (
        <article key={group.title} className="mt-5">
          <h4 className="text-sm font-semibold">{group.title}</h4>
          <p className="text-sm text-muted-foreground">{group.note}</p>
          <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-3">
            {group.tokens.map((token) => (
              <PrimitiveSwatch key={token} token={token} />
            ))}
          </ul>
        </article>
      ))}

      <h3 className="mt-10 font-heading text-lg font-semibold">
        Layer 2 — semantic pairs (<code className="text-base">src/styles/tokens.css</code>)
      </h3>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        What components actually name. Each pair is a surface plus the text colour it guarantees
        contrast for — never mix a surface with someone else&rsquo;s foreground.
      </p>
      {SEMANTIC_SWATCHES.map((group) => (
        <article key={group.title} className="mt-5">
          <h4 className="text-sm font-semibold">{group.title}</h4>
          <p className="text-sm text-muted-foreground">{group.note}</p>
          <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-4">
            {group.pairs.map((pair) => (
              <SemanticSwatch key={pair.token} pair={pair} />
            ))}
          </ul>
        </article>
      ))}

      {SWATCH_STRIPS.map((group) => (
        <article key={group.title} className="mt-8">
          <h4 className="text-sm font-semibold">{group.title}</h4>
          <p className="text-sm text-muted-foreground">{group.note}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {group.tokens.map((token) => (
              <li key={token} className="flex items-center gap-3">
                <span
                  className="h-6 w-24 shrink-0 rounded-sm border border-border"
                  style={{ background: tokenValue(token) }}
                  aria-hidden="true"
                />
                <code className="text-sm">{token}</code>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
