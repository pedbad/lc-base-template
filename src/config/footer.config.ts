/**
 * footer.config.ts — single source of truth for the footer's INSTITUTIONAL identity.
 *
 * WHAT: one Zod-validated object describing the closing plate of every page — the
 * institutional lockup, the imprint marks, the social accounts, the licence sentence
 * and any utility links (an Accessibility Statement, a Privacy Notice).
 *
 * WHY A SEPARATE FILE from course.config.ts, which is the obvious place to put it:
 * different lifetime and different owner. `course.config.ts` describes THIS COURSE —
 * title, language, hero copy — and changes per course. This describes THIS INSTITUTION,
 * and is identical across every course the Language Centre ships. Folding it in would
 * roughly double that file and mix the two.
 *
 * WHY DATA AND NOT MARKUP: a template whose footer is hand-edited per clone is exactly
 * the drift the guards exist to prevent. Re-badging a fork is editing this file.
 *
 * THE DEFECT THIS EXISTS TO KILL. Footer.tsx used to carry a FOOTER_LINKS array in
 * which Accessibility and Privacy were both `href: '#'` — links a screen reader
 * announces, the user activates, and nothing happens. `footerHref` below makes that
 * value unrepresentable, so it fails the build instead of shipping.
 *
 * WHAT IT DOES NOT CATCH, so the claim is not oversold: a well-formed URL that 404s.
 * This proves a link has a destination, not that the destination exists — catching
 * that needs the network. `src/docs/md-links.ts` makes the same trade for prose.
 *
 * FAIL-CLOSED, BLOCK BY BLOCK. Every block is optional or defaults to empty, and the
 * components render only what has data. So a fork that deletes the Cambridge marks
 * (which `LICENSE` requires it to) also deletes these rows and gets a SHORTER footer —
 * never a broken image or an empty box.
 *
 * Spec: docs/specs/2026-09-09-footer-colophon-design.md §3.1.
 */
import { z } from 'zod';

/**
 * A footer link's destination. Rejects every in-page fragment, which covers both the
 * `'#'` placeholder and the `'#content'` shape the old "Back to top" row used — that
 * row is gone, because `#content` is the skip-link target PageLayout owns and was
 * structural chrome sitting in a list a clone re-badges.
 *
 * Deliberately NOT `z.string().url()`: that would also reject a base-relative in-repo
 * path like `accessibility.html`, and a real Accessibility Statement may well be a page
 * of the course rather than an external URL.
 */
const footerHref = z
  .string()
  .min(1)
  .refine((href) => !href.startsWith('#'), {
    error:
      'A footer link must go somewhere — an in-page fragment is not a footer destination, and "#" is a dead link.',
  });

/** A linked image: the lockup, or one of the square imprint marks. */
const FooterLogoSchema = z.object({
  href: footerHref,
  /** %BASE_URL%-relative; rendered through `resolveAsset()`, never a bare path. */
  src: z.string().min(1),
  /**
   * The LINK's accessible name, so it must say where the link GOES rather than name
   * the picture — "Licence: CC BY-NC 4.0", not "Creative Commons".
   */
  alt: z.string().min(1),
  /** Dark-theme variant. Absent → the same file is used in both themes. */
  srcDark: z.string().min(1).optional(),
  /**
   * Intrinsic pixel dimensions. REQUIRED, not optional: without them a below-the-fold
   * lazy image shifts the layout the moment the footer scrolls into view, and this
   * repo's performance rules say every image states its dimensions. Making a fork
   * supply them for its own mark is the point.
   */
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

/** One social account. `icon` is a `<symbol>` id in `public/icons.svg`. */
const FooterSocialSchema = z.object({
  href: footerHref,
  /** Visible-to-AT name for the icon-only link, e.g. "Facebook". */
  label: z.string().min(1),
  /** Sprite symbol id, e.g. `social-facebook`. */
  icon: z.string().min(1),
});

export const FooterConfigSchema = z.object({
  /** The institutional lockup. Omit the key entirely and the block does not render. */
  lockup: FooterLogoSchema.optional(),
  /**
   * Who the © line names. The YEAR is read from the clock at render time and has no
   * slot here on purpose: an authored year goes stale on 1 January and nothing notices.
   */
  copyrightHolder: z.string().min(1).optional(),
  /** Square imprint marks — publisher, licence, series. Empty renders nothing. */
  marks: z.array(FooterLogoSchema).default([]),
  /** Social accounts. Empty renders nothing, not an empty row. */
  social: z.array(FooterSocialSchema).default([]),
  /** The licence sentence and its deed link. */
  licence: z
    .object({
      text: z.string().min(1),
      href: footerHref,
      /** The link's own text, e.g. "creativecommons.org". */
      linkLabel: z.string().min(1),
    })
    .optional(),
  /**
   * Utility links — an Accessibility Statement, a Privacy Notice. NONE ship: the
   * template cannot author another institution's legal pages, and a placeholder link
   * is the defect this file exists to prevent. A real deploy fills these in.
   */
  links: z.array(z.object({ href: footerHref, label: z.string().min(1) })).default([]),
});

/** Type is INFERRED from the schema — one source of truth, never drifts apart. */
export type FooterConfig = z.infer<typeof FooterConfigSchema>;
/** One linked mark, for the components that render them. */
export type FooterLogo = z.infer<typeof FooterLogoSchema>;
/** One social account, for the component that renders them. */
export type FooterSocial = z.infer<typeof FooterSocialSchema>;

/**
 * The actual values (out-of-box: the Cambridge Language Centre).
 *
 * `lockup`, `marks` and `social` are deliberately absent HERE and land with their image
 * assets, so no commit ever references a file that is not yet on disk. `links` stays
 * empty — see the schema note above.
 */
const raw = {
  lockup: {
    href: 'https://www.langcen.cam.ac.uk/',
    src: 'images/footer/ucam-lockup-light.png',
    srcDark: 'images/footer/ucam-lockup-dark.png',
    alt: 'University of Cambridge Language Centre',
    // Both files are padded to one common extent, so a theme toggle cannot change
    // the box shape — see the asset commit for why the artwork was not re-exported.
    width: 1200,
    height: 173,
  },
  copyrightHolder: 'University of Cambridge',
  marks: [
    {
      href: 'https://www.langcen.cam.ac.uk/culp/culp-index.html',
      src: 'images/footer/lc-logo-black.svg',
      srcDark: 'images/footer/lc-logo-white.svg',
      alt: 'Language Centre — CULP course index',
      // Not square, despite the reference calling these "square logos": the LC mark
      // is 0.72:1 portrait. Stating each mark's real ratio is why width AND height
      // are taken rather than a single height.
      width: 595,
      height: 831,
    },
    {
      href: 'https://creativecommons.org/licenses/by-nc/4.0/',
      src: 'images/footer/cc-logo-black.svg',
      srcDark: 'images/footer/cc-logo-white.svg',
      // Names where the link GOES, not what the picture is. The reference said
      // "Creative Commons", which tells a screen-reader user nothing about which
      // licence they are about to read.
      alt: 'Licence: CC BY-NC 4.0',
      width: 64,
      height: 64,
    },
    {
      href: 'https://www.langcen.cam.ac.uk/opencourseware',
      src: 'images/footer/elearning-logo-black.svg',
      srcDark: 'images/footer/elearning-logo-white.svg',
      alt: 'Language Centre eLearning — open courseware',
      width: 385,
      height: 394,
    },
  ],
  // `icon` is a `brand-*` symbol id in public/icons.svg. Prefixed `brand-`, not
  // `social-`, because `social-*` collides with the sprite's existing `social-icon`.
  social: [
    { href: 'https://www.facebook.com/uclangcen/', label: 'Facebook', icon: 'brand-facebook' },
    { href: 'https://x.com/uclangcen', label: 'X (Twitter)', icon: 'brand-x' },
    {
      href: 'https://www.youtube.com/cambridgeuniversity',
      label: 'YouTube',
      icon: 'brand-youtube',
    },
    {
      // The reference's href carried a trailing `/posts/?feedView=all`, which is a
      // view state rather than the account. Linked to the company page instead.
      href: 'https://www.linkedin.com/company/university-of-cambridge-language-centre/',
      label: 'LinkedIn',
      icon: 'brand-linkedin',
    },
    {
      href: 'https://www.instagram.com/cambridgeuniversity/',
      label: 'Instagram',
      icon: 'brand-instagram',
    },
  ],
  licence: {
    // CC BY-NC 4.0, matching LICENSE. The reference says BY-NC-ND; that is the French
    // course's licence, not this template's, so the wording is NOT copied across —
    // and the CC mark above links to the by-nc deed to match.
    text: 'This work is licensed under the Creative Commons Attribution-NonCommercial 4.0 International Licence. To view a copy of this licence, visit',
    href: 'https://creativecommons.org/licenses/by-nc/4.0/',
    linkLabel: 'creativecommons.org',
  },
};

/** Validate at load. Invalid `raw` throws here → dev/build dies immediately. */
export const footerConfig: FooterConfig = FooterConfigSchema.parse(raw);
