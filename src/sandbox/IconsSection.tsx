/**
 * IconsSection — the SVG preview half of the sandbox (buildlist 16).
 *
 * WHY IT EXISTS. `public/icons.svg` is a `<symbol>` sprite, and a symbol's ID is the only
 * handle on it. Opening the file in a browser renders NOTHING (symbols are not drawn) and
 * opening it in an editor shows path data, so the one question anyone has of it — "what
 * icons are there and what are they called?" — has no answer without this page.
 *
 * THE SPRITE URL GOES THROUGH resolveAsset(). A `<use href="icons.svg#x">` written by hand
 * resolves against the CURRENT page, so it works at `/debug-sandbox.html` and 404s the
 * moment the app is served from a sub-path — carry-forward anti-pattern #35, and exactly
 * what guard c watches for. `spriteHref()` is the choke point; no literal reaches an href.
 *
 * COLOUR IS NOT OURS TO SET. The sprite's own paths carry brand fills, so the swatch sits
 * on `--card` and the icons render as authored — a `currentColor` icon set would be a
 * different (and better) sprite, but that is a content decision, not a sandbox one.
 */
import { resolveAsset } from '@/lib/assets';
import { SANDBOX_ICON_IDS } from './sandbox-catalog';

/** `bluesky-icon` → the base-aware sprite URL for that symbol. */
const spriteHref = (id: string) => `${resolveAsset('icons.svg')}#${id}`;

export default function IconsSection() {
  return (
    <section aria-labelledby="icons-heading" className="scroll-mt-8" id="icons">
      <h2 id="icons-heading" className="font-heading text-2xl font-bold">
        Icon sprite
      </h2>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Every <code>&lt;symbol&gt;</code> in <code>public/icons.svg</code>, with its id. Reference
        one as <code>&lt;use href=&#123;spriteHref(id)&#125; /&gt;</code> — through{' '}
        <code>resolveAsset()</code>, never as a bare path. The UI icons elsewhere in the app come
        from <code>lucide-react</code> instead; this sprite is for the brand and social marks Lucide
        has no equivalent for.
      </p>

      <ul className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-4">
        {SANDBOX_ICON_IDS.map((id) => (
          <li
            key={id}
            className="flex flex-col items-center gap-3 rounded-md border border-border bg-card p-4"
          >
            <svg className="size-8" role="img" aria-label={id}>
              <use href={spriteHref(id)} />
            </svg>
            <code className="text-center text-xs break-all">{id}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}
