/**
 * FooterSocial — the icon-only social row in the footer colophon (§D · D1).
 *
 * A LABELLED GROUP, NOT A NAV. Spec §17 allows exactly one primary nav landmark per
 * page and the header owns it, so a second one here would fail guard h on both pages.
 * `role="group"` with `aria-label` is the right shape and needs no heading, which
 * matters because spec §5 forbids a heading anywhere in the footer. This is the one
 * piece of the reference's markup that ports as-is, because it already got this right.
 *
 * ICONS COME FROM THE SPRITE, AND FOLLOW THE THEME BY THEMSELVES. The five `brand-*`
 * symbols in `public/icons.svg` carry `fill="currentColor"`, so referencing them
 * through `<use>` inherits the band's text colour — dark on the light band, light on
 * the dark one, with no dark-mode rules at all.
 *
 * That is exactly what the reference could NOT do, and worth recording: its source SVGs
 * are already `fill="currentColor"`, but it loads them with `<img src>`, and an
 * `<img>`-loaded SVG cannot inherit colour from the host document. Hence its
 * `filter: invert(1)` hack and its ten `.dark` display-toggle rules — all of which this
 * file simply does not need. Verified in-browser against the real sprite, both bands.
 *
 * THE SPRITE URL GOES THROUGH resolveAsset(). A hand-written `/icons.svg#id` is
 * root-absolute and 404s under a non-root base (anti-pattern #28). `spriteHref()` is
 * the choke point, mirroring src/sandbox/IconsSection.tsx.
 */
import type { FooterSocial as FooterSocialEntry } from '@/config/footer.config';
import { resolveAsset } from '@/lib/assets';
import FooterLink from './FooterLink';

interface FooterSocialProps {
  /** Social accounts. Empty → nothing renders, not an empty row. */
  accounts: readonly FooterSocialEntry[];
}

/** `brand-facebook` → the base-aware sprite URL for that symbol. */
const spriteHref = (id: string) => `${resolveAsset('icons.svg')}#${id}`;

export default function FooterSocial({ accounts }: FooterSocialProps) {
  if (accounts.length === 0) return null;

  return (
    <div className="footer-social" role="group" aria-label="Follow us">
      {accounts.map((account) => (
        <FooterLink key={account.icon} href={account.href} className="footer-social-link">
          {/* The icon is decorative — the visually-hidden label is the link's name.
              Without it an icon-only link announces as "link" and nothing else. */}
          <svg className="footer-social-icon" aria-hidden="true" focusable="false">
            <use href={spriteHref(account.icon)} />
          </svg>
          <span className="sr-only">{account.label}</span>
        </FooterLink>
      ))}
    </div>
  );
}
