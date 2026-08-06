/**
 * LoCard — one Learning Object as a card on the course landing page (Phase D).
 *
 * Card anatomy is ported from French-Basic-2026's landing cards: an illustration band
 * carrying the title in a glass overlay, the blurb beneath it, and a "Start learning"
 * affordance that leans forward on hover. Everything on it comes from that LO's own
 * manifest — `title`, `description`, `image` — so a card exists, and reads correctly,
 * because a folder exists.
 *
 * THE WHOLE CARD IS ONE LINK: one tab stop per lesson rather than three, and the
 * hover/focus states belong to that single control. Nothing inside it is separately
 * interactive, so there is no nested-interactive problem.
 *
 * The href goes through `resolveAsset()`, never a bare `<slug>.html`: a relative href
 * resolves against the CURRENT page URL and a root-absolute one 404s under a non-root
 * base (anti-pattern #28). Same rule for the image.
 *
 * Unlike the reference, links stay in this tab — the LO page header carries a link
 * home, so a new tab per lesson would only pile up windows.
 */
import { BookOpenIcon, ArrowRightIcon } from 'lucide-react';
import { resolveAsset } from '@/lib/assets';
import type { LoIndexEntry } from '@/lo/lo-index';

interface LoCardProps {
  /** The LO this card links to. */
  lesson: LoIndexEntry;
  /** Position in the grid; staggers the entrance so cards arrive in reading order. */
  index: number;
}

/** Cap the stagger so a long course's last cards are not still waiting to appear. */
const MAX_STAGGER_MS = 480;
const STAGGER_STEP_MS = 60;

export default function LoCard({ lesson, index }: LoCardProps) {
  return (
    <li
      className="animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both duration-500 motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(index * STAGGER_STEP_MS, MAX_STAGGER_MS)}ms` }}
    >
      <a href={resolveAsset(`${lesson.slug}.html`)} className="lo-card">
        <span className="lo-card-band">
          {lesson.image === undefined ? (
            // No illustration authored: a decorative icon band, not a broken image
            // and not an empty box. `image` is optional on purpose (lo-schema.ts).
            <span className="lo-card-band-fallback">
              <BookOpenIcon className="size-10" aria-hidden="true" />
            </span>
          ) : (
            <img
              src={resolveAsset(lesson.image)}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="lo-card-image"
            />
          )}
          {/* The band reserves its box by aspect-ratio in CSS, so no width/height
              attributes here: an author's image has whatever intrinsic size it has,
              and stating the wrong one would be a lie that buys nothing — the space
              is already reserved, so there is no layout shift either way. */}
          <span className="lo-card-title-overlay">
            <h3 className="font-heading text-base leading-tight font-bold text-foreground sm:text-lg">
              {lesson.title}
            </h3>
          </span>
        </span>

        {lesson.description === undefined ? null : (
          <p className="lo-card-blurb">{lesson.description}</p>
        )}

        <span className="lo-card-cta">
          Start learning
          <ArrowRightIcon className="lo-card-cta-icon size-4" aria-hidden="true" />
        </span>
      </a>
    </li>
  );
}
