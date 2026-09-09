/**
 * FooterMarks — the institutional lockup and the imprint marks (§D · D1).
 *
 * Everything is data from `footer.config.ts`, and each block renders only when it has
 * data: no lockup and no marks renders NOTHING, not an empty box. That is what makes a
 * fork which strips the Cambridge marks (as `LICENSE` requires) get a shorter footer
 * rather than a broken one.
 *
 * WHY TWO <img>s PER MARK AND A CSS TOGGLE, when `<picture>` is the obvious answer:
 *
 *   - `<picture>` + `prefers-color-scheme` would ignore the theme this app actually
 *     uses. The theme is CLASS-based (`.dark`, set by ThemeToggle), so a media query
 *     would disagree with the toggle the moment a reader overrides their OS setting.
 *   - Choosing `src` in JS would make the first client render differ from the
 *     prerendered markup, which the Phase D handover §3 forbids outright.
 *
 * So the pair is rendered and Tailwind's `dark:` variant hides one. That variant is
 * wired to the same `.dark` class at src/index.css:47 (`@custom-variant dark`), so it
 * cannot drift from ThemeToggle. `display: none` also removes the hidden copy from the
 * accessibility tree, so the duplicated `alt` is never announced twice.
 *
 * WIDTH AND HEIGHT ARE MANDATORY, not decoration. The footer is below the fold, so
 * these images are lazy; a lazy image with no intrinsic size shifts the layout the
 * moment the footer scrolls into view. The two lockup files are padded to one common
 * 1200x173 extent precisely so a theme toggle cannot change the box either — see the
 * asset commit for why re-exporting the artwork was rejected.
 */
import type { FooterLogo } from '@/config/footer.config';
import { resolveAsset } from '@/lib/assets';
import FooterLink from './FooterLink';

interface FooterMarksProps {
  /** The institutional lockup. Absent → the block does not render. */
  lockup?: FooterLogo;
  /** Square imprint marks — publisher, licence, series. Empty → nothing renders. */
  marks: readonly FooterLogo[];
}

/**
 * One mark's image, as a light/dark pair when `srcDark` is given and a single image
 * when it is not. `alt` is repeated on both because only one is ever displayed.
 */
function MarkImage({ logo, className }: { logo: FooterLogo; className: string }) {
  // `alt` is passed EXPLICITLY on each <img> rather than spread in with the rest.
  // jsx-a11y cannot see an alt that arrives through a spread and flags it, and the
  // rule is right to: the most load-bearing attribute on the element should be
  // readable at the call site, not hidden in an object above it.
  const shared = { width: logo.width, height: logo.height, loading: 'lazy' as const };

  if (logo.srcDark === undefined) {
    return <img src={resolveAsset(logo.src)} alt={logo.alt} className={className} {...shared} />;
  }

  return (
    <>
      <img
        src={resolveAsset(logo.src)}
        alt={logo.alt}
        className={`${className} dark:hidden`}
        {...shared}
      />
      <img
        src={resolveAsset(logo.srcDark)}
        alt={logo.alt}
        className={`${className} hidden dark:block`}
        {...shared}
      />
    </>
  );
}

export default function FooterMarks({ lockup, marks }: FooterMarksProps) {
  if (lockup === undefined && marks.length === 0) return null;

  return (
    <div className="footer-marks">
      {lockup === undefined ? null : (
        <FooterLink href={lockup.href} className="footer-lockup">
          <MarkImage logo={lockup} className="footer-lockup-image" />
        </FooterLink>
      )}

      {marks.length === 0 ? null : (
        <ul className="footer-mark-row">
          {marks.map((mark) => (
            <li key={mark.src}>
              <FooterLink href={mark.href} className="footer-mark">
                <MarkImage logo={mark} className="footer-mark-image" />
              </FooterLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
