/**
 * LoHero — the full-bleed banner every LO page opens on, directly under the sticky
 * header (spec docs/specs/2026-10-05-lo-hero-banner-design.md). It holds the page's
 * ONE <h1>, moved here from PageLayout, so the LO's name is announced exactly once.
 *
 * Two variants, one shape. With `hero` art: a decorative image filling a fixed-ratio
 * box, the title on a solid panel at its bottom-start corner. Without: the same panel
 * on a --hero-band surface. Every LO page therefore opens the same way and no LO is
 * blocked on artwork.
 *
 * A <div>, NOT a <header>. A <header> inside <main> is no landmark, so it would add
 * nothing for assistive technology, and it would hand guard h's header-scoped checks
 * (`nav-outside-header`) a second header to reason about. The hero introduces no
 * section and needs no landmark of its own.
 *
 * The image is alt="" unless the author supplies `hero.alt` — the <h1> already names
 * the page. alt="" alone is the repo's decorative-<img> convention; no aria-hidden.
 *
 * Nothing here reads the client: no viewport, no cookie, no effect, no useIsHydrated.
 * The prerendered markup is the final markup.
 *
 * React 19 hoists a `<link rel="preload" as="image">` for this <img> when it server-
 * renders (it does so for every non-lazy image). In the prerender that link lands at the
 * top of #root; hydration skips hoisted resources, so client and server still agree.
 */
import type { LoHero as LoHeroConfig } from '@/config/lo-schema';
import { resolveAsset } from '@/lib/assets';
import './lo-hero.css';

interface LoHeroProps {
  /** The LO title — rendered as the page's single <h1>. */
  title: string;
  /** Optional banner art from lo.json. Absent → the band variant. */
  hero?: LoHeroConfig;
}

export default function LoHero({ title, hero }: LoHeroProps) {
  return (
    <div className="lo-hero" data-variant={hero === undefined ? 'band' : 'image'}>
      {hero === undefined ? null : (
        <img
          className="lo-hero-image"
          src={resolveAsset(hero.src)}
          alt={hero.alt ?? ''}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      )}
      <div className="lo-hero-inner">
        {/* Type styles unchanged from the <h1> PageLayout used to render. Colour is NOT
            a utility here: utilities outrank @layer components, and the panel's colour
            pair lives in lo-hero.css so it stays one verified pair. */}
        <h1 className="lo-hero-title font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
      </div>
    </div>
  );
}
