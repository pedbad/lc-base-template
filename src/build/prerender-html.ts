/**
 * prerender-html.ts — inject one rendered LO into the BUILT index.html (Part D).
 *
 * WHY the built index.html is the template (Part D §3 decision, 2026-08-06):
 * `renderToString` hands back `<body>` markup, not a `<head>`, and a prerendered
 * page must reference the HASHED bundles Vite just emitted — hashes that change
 * every build, so they can never be hardcoded here. Vite has already rewritten
 * `dist/index.html`'s tags to those exact hashed URLs and resolved `%BASE_URL%`,
 * so reusing that file inherits the correct `<head>` for free. The alternative —
 * reading `dist/.vite/manifest.json` and re-emitting `<script>`/`<link>` tags —
 * would duplicate knowledge of the head (favicon, font preloads, the pre-hydration
 * theme script) that index.html already owns, and drift from it silently.
 *
 * The coupling that buys is narrow and CHECKED: this module needs exactly two
 * anchors (`<title>` and an empty `<div id="root">`), and a missing anchor throws
 * rather than emitting a page with a stock title or no app in it.
 *
 * Pure string work — the disk I/O lives in `scripts/prerender.tsx`.
 */

/**
 * The empty root div the app mounts into; the injection anchor. Attributes are
 * matched and DISCARDED, not preserved: index.html carries its own
 * `data-lo-folder` for the dev server, and a generated page must name its own LO.
 */
const ROOT_DIV_PATTERN = /<div id="root"[^>]*><\/div>/;
const TITLE_PATTERN = /<title>[\s\S]*?<\/title>/i;
/** `[^>]` matches newlines, so this spans Prettier's multi-line meta tag. */
const DESCRIPTION_META_PATTERN = /[ \t]*<meta\s[^>]*\bname="description"[^>]*>\n?/i;

/** Escape author text for an HTML text node or a double-quoted attribute value. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface PrerenderPageInput {
  /** The BUILT `dist/index.html` — hashed asset tags already rewritten by Vite. */
  template: string;
  /** The LO rendered to markup, destined for inside the root div. */
  appHtml: string;
  /**
   * The LO's folder name (`lo-00-example`), stamped on the root div so the client
   * entry hydrates the SAME LO this page was rendered from. The FOLDER, not the
   * slug: the folder name is what `loadLo` takes (design spec §15).
   */
  loFolder: string;
  /** The LO manifest's `title` — the page `<title>`. */
  title: string;
  /** The LO manifest's `description`; omitted when the author declared none. */
  description?: string;
}

/**
 * Build one LO's static HTML page from the built template plus its rendered markup.
 *
 * @throws Error naming the missing anchor when the template's shape has changed
 */
export function buildPrerenderedHtml({
  template,
  appHtml,
  loFolder,
  title,
  description,
}: PrerenderPageInput): string {
  if (!ROOT_DIV_PATTERN.test(template)) {
    throw new Error(
      'prerender: template has no empty <div id="root"> to mount into — index.html\'s root element changed shape',
    );
  }
  if (!TITLE_PATTERN.test(template)) {
    throw new Error("prerender: template has no <title> to replace — index.html's <head> changed");
  }

  // The stock description is a claim about the TEMPLATE, not this LO. When the LO
  // declares none, the tag goes rather than describing the page falsely.
  const withDescription =
    description === undefined
      ? template.replace(DESCRIPTION_META_PATTERN, '')
      : template.replace(
          DESCRIPTION_META_PATTERN,
          `    <meta name="description" content="${escapeHtml(description)}" />\n`,
        );

  return withDescription
    .replace(TITLE_PATTERN, `<title>${escapeHtml(title)}</title>`)
    .replace(
      ROOT_DIV_PATTERN,
      `<div id="root" data-lo-folder="${escapeHtml(loFolder)}">${appHtml}</div>`,
    );
}
