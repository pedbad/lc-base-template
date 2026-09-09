/**
 * FooterLink — one link in the footer colophon (§D · D1).
 *
 * Extracted from Footer.tsx once FooterMarks and FooterSocial became consumers. Two
 * sites is the threshold: the alternative is a copied `target`/`rel`/`sr-only` triple,
 * and a link that loses its `rel` fails silently — the page still works, it is just
 * less safe, which is the kind of drift nobody notices.
 *
 * EXTERNAL LINKS OPEN IN A NEW TAB, and say so. Leaving a lesson mid-exercise is the
 * worse outcome, so this deliberately differs from LoCard, which keeps LESSON links in
 * the same tab because the LO page carries a route home. WCAG 3.2.5 (AAA) does not
 * require the announcement, but it costs one visually-hidden span and this is the
 * accessibility pass.
 *
 * `rel="noopener noreferrer"`: `noopener` so the opened page cannot reach back through
 * `window.opener`, `noreferrer` so it is not told which course the learner came from.
 * Modern browsers imply `noopener` for `target="_blank"`, but relying on a browser
 * default is not the same as stating the rule.
 */
import type { ReactNode } from 'react';

/**
 * Whether a href leaves the site. Only absolute http(s) URLs do — a base-relative path
 * like `accessibility.html` is a page of this course. Bare fragments cannot appear
 * here at all: `footer.config.ts` rejects them at load.
 */
const isExternalHref = (href: string): boolean => /^https?:\/\//i.test(href);

interface FooterLinkProps {
  href: string;
  /** Extra classes for the anchor; the shared focus/hover treatment is always applied. */
  className?: string;
  children: ReactNode;
}

export default function FooterLink({ href, className, children }: FooterLinkProps) {
  const external = isExternalHref(href);
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={className}
    >
      {children}
      {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </a>
  );
}
