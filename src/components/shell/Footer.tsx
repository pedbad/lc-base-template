/**
 * Footer — the shell's plain <footer> landmark, and the page's colophon (§D · D1).
 *
 * Per spec §5 there is deliberately NO heading element anywhere inside (a decorative
 * <h2> in the footer was a french-lo-1 mistake that broke strict heading-outline
 * checks — not repeated here), and deliberately NO <nav>: spec §17 allows exactly one
 * primary nav landmark per page and the header already owns it. The social row is a
 * labelled `role="group"` for the same reason.
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
 *
 * LAYOUT MIRRORS THE REFERENCE'S THREE GROUPS: the lockup with its © line, the marks
 * and social as one visual cluster, then the licence. Styling is in footer.css.
 */
import { footerConfig } from '@/config/footer.config';
import FooterLink from './FooterLink';
import FooterMarks from './FooterMarks';
import FooterSocial from './FooterSocial';

export default function Footer() {
  const { lockup, copyrightHolder, marks, social, licence, links } = footerConfig;

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-identity">
          <FooterMarks lockup={lockup} marks={[]} />

          {copyrightHolder === undefined ? null : (
            <p className="footer-copyright">
              {/* The year is read from the clock, never authored — an authored year
                  goes stale on 1 January and nothing notices. That makes it the one
                  value here that can legitimately differ between the prerender (build
                  time) and the first client render (view time), across a New Year
                  boundary on a build that was not redeployed. suppressHydrationWarning
                  is React's sanctioned escape hatch for exactly this, scoped to the one
                  text node rather than the paragraph. */}
              <>© </>
              <span suppressHydrationWarning>{new Date().getFullYear()}</span> {copyrightHolder}
            </p>
          )}
        </div>

        <div className="footer-cluster">
          <FooterMarks marks={marks} />
          <FooterSocial accounts={social} />
        </div>

        {licence === undefined ? null : (
          <p className="footer-licence">
            {licence.text}{' '}
            <FooterLink href={licence.href} className="footer-licence-link">
              {licence.linkLabel}
            </FooterLink>
          </p>
        )}

        {links.length === 0 ? null : (
          <ul className="footer-links">
            {links.map((link) => (
              <li key={link.label}>
                <FooterLink href={link.href} className="footer-link">
                  {link.label}
                </FooterLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </footer>
  );
}
