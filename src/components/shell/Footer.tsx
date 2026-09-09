/**
 * Footer — the shell's plain <footer> landmark, and the page's colophon (§D · D1).
 *
 * Per spec §5 there is deliberately NO heading element anywhere inside (a decorative
 * <h2> in the footer was a french-lo-1 mistake that broke strict heading-outline
 * checks — not repeated here), and deliberately NO <nav>: spec §17 allows exactly one
 * primary nav landmark per page and the header already owns it.
 *
 * WHAT CHANGED (§D · D1). This used to render "© {course}. Placeholder footer — real
 * links land in a later Phase C part." on every page of a live course, plus a
 * FOOTER_LINKS array in which Accessibility and Privacy were both `href: '#'`. The
 * whole array is gone — all three rows, not only the two dead ones. "Back to top"
 * went too: it pointed at `#content`, the skip-link and <main tabindex="-1"> pair
 * PageLayout owns, so it was structural chrome sitting in a list a clone re-badges.
 * The affordance is not lost — it is a real component (BackToTopButton).
 *
 * EVERYTHING HERE IS DATA. Content comes from `footer.config.ts`, validated at import,
 * and every block renders only when it has data. So a fork that strips the Cambridge
 * marks gets a shorter footer, never a broken one — and `href: '#'` fails the build.
 */
import { footerConfig } from '@/config/footer.config';

/**
 * Whether a href leaves the site. Only absolute http(s) URLs do; a base-relative path
 * like `accessibility.html` is a page of this course.
 */
const isExternal = (href: string): boolean => /^https?:\/\//i.test(href);

/**
 * One footer link. External links open in a new tab — leaving a lesson mid-exercise is
 * the worse outcome — and say so in their accessible name. WCAG 3.2.5 is AAA and does
 * not require the warning, but it costs one visually-hidden span.
 *
 * `rel="noopener noreferrer"` on every external link: `noopener` so the opened page
 * cannot reach back through `window.opener`, `noreferrer` so it is not told where the
 * learner came from.
 */
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = isExternal(href);
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="rounded-sm underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:text-foreground"
    >
      {children}
      {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </a>
  );
}

export default function Footer() {
  const { copyrightHolder, licence, links } = footerConfig;

  return (
    <footer className="mt-16 border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground">
        {copyrightHolder === undefined ? null : (
          <p>
            {/* The year is read from the clock, never authored — an authored year goes
                stale on 1 January and nothing notices. That makes it the one value here
                that can legitimately differ between the prerender (build time) and the
                first client render (view time), across a New Year boundary on a build
                that was not redeployed. `suppressHydrationWarning` is React's sanctioned
                escape hatch for exactly this case, scoped to the one text node rather
                than the paragraph. */}
            <>© </>
            <span suppressHydrationWarning>{new Date().getFullYear()}</span> {copyrightHolder}
          </p>
        )}

        {licence === undefined ? null : (
          <p>
            {licence.text} <FooterLink href={licence.href}>{licence.linkLabel}</FooterLink>
          </p>
        )}

        {links.length === 0 ? null : (
          <ul className="flex flex-wrap gap-4">
            {links.map((link) => (
              <li key={link.label}>
                <FooterLink href={link.href}>{link.label}</FooterLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </footer>
  );
}
