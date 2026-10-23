/**
 * docs-markdown.ts — the markdown→HTML step behind the sandbox docs hub
 * (buildlist 18, spec §14).
 *
 * §14's constraint is the whole design: the markdown docs are the SINGLE SOURCE OF
 * TRUTH, and the sandbox RENDERS them. Edit `DESIGNER.md` once and GitHub and the
 * sandbox both update. No hand-copied prose exists to drift, which is why this file
 * reads the real `.md` files and holds no content of its own.
 *
 * ── WHY BUILD TIME AND NOT RUNTIME ──────────────────────────────────────────────────
 * The alternative was `fetch('DESIGNER.md')` + parse in the browser, which needs the
 * markdown files COPIED into `public/` (a second copy of the single source — the exact
 * thing §14 forbids) and ships a parser to a debug page. Rendering here instead means
 * markdown-it stays a devDependency, never reaches a bundle, and the hub is plain HTML
 * strings by the time the page loads. It runs in dev too — `sandbox-docs-plugin.ts`
 * calls this from a virtual module, so `bun run dev` and `bun run build` render the
 * same way and a saved `.md` shows up on the next reload.
 *
 * ── SANITISED BY DEFAULT ────────────────────────────────────────────────────────────
 * `html: false`, so raw HTML in a doc is ESCAPED rather than passed through. These docs
 * are repo-authored, so the risk today is nil — but provenance is an argument about
 * today's content and a renderer outlives it, and markdown permits raw HTML by spec. It
 * costs nothing here: the rendered docs contain no raw HTML beyond STRUCTURE's comment
 * markers, which `drop_comment_paragraphs` below hides as GitHub does. (README does,
 * a `<div align="center">` banner, and README is not in the hub — see SANDBOX_DOCS.)
 * Escaping in the parser also means no second dependency: no DOM-based sanitiser, no
 * post-pass over the output.
 *
 * ── ALIAS-FREE ──────────────────────────────────────────────────────────────────────
 * `vite.config.ts` reaches this file through the plugin, and the config is bundled
 * before its own `resolve.alias` exists, so nothing here may use `@/…`.
 *
 * ── THE THREE LINK CASES, EACH DECIDED ──────────────────────────────────────────────
 * All four docs render onto ONE page, so no routing and no state exist and every
 * in-page anchor resolves. That makes link handling a rewrite, not a lookup:
 *
 *   1. A link to a doc the hub renders (`STRUCTURE.md`, `DESIGNER.md#job-1`) becomes an
 *      in-page anchor. Anchors are namespaced per doc (`structure--the-files`) because
 *      four docs on one page means four chances at a duplicate `#the-files`.
 *   2. An external `http(s)` link stays a link, in a new tab, `rel="noopener
 *      noreferrer"`.
 *   3. Anything else relative (`docs/TOOLING.md`, `src/styles/palette.css`) is
 *      DE-LINKED to its path as text. It must not be a dead click, and it deliberately
 *      does NOT become a GitHub URL: this repo is a TEMPLATE, so a hardcoded upstream
 *      URL would send every clone's designer to somebody else's repository.
 *
 * ── DOCS ON PAGES OF THEIR OWN ──────────────────────────────────────────────────────
 * `docs/STYLE.md` renders on the Code style debug page (`code-style.html`), and
 * `docs/culp-syllabi/README.md` on the CULP syllabi page (`culp-syllabi.html`), not in
 * the hub, so case 1 crosses pages for them: a hub doc's link to one opens its page, and
 * their links to a hub doc open the sandbox at that doc. A relative link is read from
 * the linking doc's own folder, as GitHub reads it: `../STYLE.md` in the CULP README is
 * `docs/STYLE.md`. The page name is relative on purpose:
 * every debug page sits in the one folder the build is served from, so a sibling name
 * resolves correctly under a `./` build and a fixed `BASE_URL` alike, and this
 * build-time HTML never sees the runtime base helpers.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import MarkdownIt from 'markdown-it';

/** One markdown doc the hub renders. */
export interface SandboxDoc {
  /** Short id, used as the anchor namespace and the nav key. */
  readonly id: string;
  /** Repo-relative path. */
  readonly file: string;
  /** Who the doc is written for (spec §14's Audience column). */
  readonly audience: string;
  /** One line on what it covers, for the hub's nav. */
  readonly blurb: string;
}

/** A heading, for the hub's table of contents. */
export interface DocHeading {
  readonly id: string;
  readonly text: string;
  readonly level: number;
}

/** A rendered doc. */
export interface SandboxDocPage extends SandboxDoc {
  readonly html: string;
  readonly headings: readonly DocHeading[];
}

/**
 * The docs the hub renders, in spec §14's order: DESIGNER (designer), CONTRIBUTING
 * (developer), STRUCTURE (project tree), with AGENTS surfaced "for transparency".
 *
 * README IS DELIBERATELY ABSENT. §14 casts it as the GitHub front door — "what this is,
 * quickstart, links to the others" — so in a hub reached from the sandbox it is the one
 * doc with nothing to say. It also opens with a raw HTML banner, which `html: false`
 * would render as escaped markup.
 */
export const SANDBOX_DOCS: readonly SandboxDoc[] = [
  {
    id: 'designer',
    file: 'DESIGNER.md',
    audience: 'designer',
    blurb: 'Theme tokens, palette, fonts, how to read this page, and what not to do.',
  },
  {
    id: 'contributing',
    file: 'CONTRIBUTING.md',
    audience: 'developer',
    blurb: 'Setup, the per-LO authoring loop, the eight guards, and the verify gate.',
  },
  {
    id: 'structure',
    file: 'STRUCTURE.md',
    audience: 'developer',
    blurb: 'Annotated project tree — where LOs, images and audio go.',
  },
  {
    id: 'agents',
    file: 'AGENTS.md',
    audience: 'AI agents',
    blurb: 'Repository house rules for an agent editing the source.',
  },
] as const;

/** The code style guide, rendered on its own debug page rather than in the hub. */
export const CODE_STYLE_DOC: SandboxDoc = {
  id: 'style',
  file: 'docs/STYLE.md',
  audience: 'developer',
  blurb: 'How the code is written: what the tools enforce, and the habits they do not.',
};

/** The CULP syllabi folder's README, rendered on its own debug page. */
export const CULP_SYLLABI_DOC: SandboxDoc = {
  id: 'culp',
  file: 'docs/culp-syllabi/README.md',
  audience: 'anyone turning teaching material into a lesson',
  blurb:
    'How the CULP syllabi notes are laid out, and the skill that checks material against them.',
};

/** The debug page each doc renders on: the hub's four share the sandbox. */
const HUB_PAGE = 'debug-sandbox.html';
const PAGE_DOCS: ReadonlyMap<string, string> = new Map([
  [CODE_STYLE_DOC.id, 'code-style.html'],
  [CULP_SYLLABI_DOC.id, 'culp-syllabi.html'],
]);
const pageOf = (docId: string): string => PAGE_DOCS.get(docId) ?? HUB_PAGE;

const ALL_DOCS = [...SANDBOX_DOCS, CODE_STYLE_DOC, CULP_SYLLABI_DOC];
const DOC_BY_FILE = new Map(ALL_DOCS.map((doc) => [doc.file, doc]));
const DOC_BY_ID = new Map(ALL_DOCS.map((doc) => [doc.id, doc]));

/** Repo root, from this file's location — `readSandboxDocs()` needs no argument. */
const DEFAULT_REPO_ROOT = path.resolve(import.meta.dirname, '../..');

/**
 * GitHub's heading-slug shape, near enough for anchors we also GENERATE: lowercase,
 * punctuation dropped (not hyphenated — so `docs:tree` slugs as `docstree`), spaces
 * hyphenated. Both sides of every anchor comparison go through this one function, so
 * the target and the link agree by construction rather than by luck.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** `designer` + `the-files` → `designer--the-files`; the doc id alone with no anchor. */
export function docAnchorId(docId: string, anchor: string): string {
  return anchor ? `${docId}--${anchor}` : docId;
}

/** Per-render state: which doc, its headings so far, and the duplicate-slug counters. */
interface RenderState {
  readonly docId: string;
  /** How far below its markdown level each heading renders (HEADING_OFFSET). */
  readonly headingOffset: number;
  readonly headings: DocHeading[];
  readonly slugCounts: Map<string, number>;
  /** Whether each open link was de-linked, so `link_close` closes the right tag. */
  readonly delinked: boolean[];
  /** Code blocks so far — the ordinal that makes each block's region name unique. */
  codeBlocks: number;
  /** Tables so far, likewise. */
  tables: number;
}

/** `#the-files` within one doc, uniquified the way GitHub does (`-1`, `-2`, …). */
function uniqueAnchor(state: RenderState, text: string): string {
  const base = slugify(text);
  const seen = state.slugCounts.get(base) ?? 0;
  state.slugCounts.set(base, seen + 1);
  return seen === 0 ? base : `${base}-${seen}`;
}

/** Strip a leading `./` or `../` chain — `../DESIGNER.md` is still DESIGNER.md. */
function stripRelativePrefix(target: string): string {
  return target.replace(/^(?:\.{1,2}\/)+/, '');
}

/**
 * Where a link to `doc` points from the doc being rendered: an in-page anchor when both
 * render on one page, otherwise the other page (at its top for a page-sized doc, at the
 * doc's article for a hub doc).
 */
function docHref(fromDocId: string, doc: SandboxDoc, fragment: string): string {
  const anchor = docAnchorId(doc.id, fragment);
  const page = pageOf(doc.id);
  if (page === pageOf(fromDocId)) return `#${anchor}`;
  if (!fragment && page !== HUB_PAGE) return page;
  return `${page}#${anchor}`;
}

/** The doc a link target refers to, read from the linking doc's folder, if a debug page renders it. */
function resolveDocTarget(fromDocId: string, target: string): SandboxDoc | undefined {
  const folder = path.posix.dirname(DOC_BY_ID.get(fromDocId)?.file ?? '');
  return DOC_BY_FILE.get(stripRelativePrefix(path.posix.join(folder, target)));
}

const md = new MarkdownIt({
  // Raw HTML is ESCAPED, not passed through — the sanitising decision, in one flag.
  html: false,
  // Bare URLs stay bare: the docs write their links out, and auto-linking prose is a
  // second way for a link to appear that nothing here reviewed.
  linkify: false,
  typographer: false,
});

/** A paragraph's whole text, when that text is nothing but HTML comments. */
const COMMENT_ONLY = /^(?:\s*<!--[\s\S]*?-->)+\s*$/;

/**
 * HTML comments are invisible on GitHub, and STRUCTURE.md's `<!-- docs:tree:start -->`
 * markers rely on that. `html: false` cannot tell a comment from markup, so it escapes
 * each one into a visible paragraph. A paragraph made ONLY of comments is dropped here,
 * which is exactly what GitHub shows. Nothing else is: a comment inside a code sample is
 * content, and one sharing a paragraph with prose stays escaped, as all raw HTML does.
 */
md.core.ruler.push('drop_comment_paragraphs', (state) => {
  state.tokens = state.tokens.filter((token, idx, tokens) => {
    const inline =
      token.type === 'paragraph_open'
        ? tokens[idx + 1]
        : token.type === 'paragraph_close'
          ? tokens[idx - 1]
          : token.type === 'inline'
            ? token
            : undefined;
    return !(inline?.type === 'inline' && COMMENT_ONLY.test(inline.content));
  });
});

/**
 * How far below its markdown level a heading renders. DocsSection puts each doc under
 * `<h2>Docs</h2>` and an article `<h3>{file}</h3>`, so a doc's `#` title is an `h4` —
 * rendered as written it was a second page `<h1>`, four of them (TODO §D10). The
 * markdown keeps its `#`: GitHub renders it standalone, where `h1` is right. On a doc's
 * own page (Code style, CULP syllabi) the only heading above the doc is the page's own
 * `<h1>`, so its `#` is an `h2`.
 */
const HEADING_OFFSET = 3;
const PAGE_HEADING_OFFSET = 1;

/** `h1` → `h4` (or `h2` on a page of its own) … clamped at `h6`, where HTML stops. */
function nestedHeadingTag(markdownTag: string | undefined, offset: number): string {
  const level = Number(markdownTag?.slice(1) ?? 2);
  return `h${Math.min(level + offset, 6)}`;
}

md.renderer.rules.heading_open = (tokens, idx, _options, env) => {
  const state = env as unknown as RenderState;
  const token = tokens[idx];
  const text = tokens[idx + 1]?.content ?? '';
  const id = docAnchorId(state.docId, uniqueAnchor(state, text));
  // The MARKDOWN level, not the rendered one: the contents nav picks `##`/`###` by it.
  const level = Number(token?.tag?.slice(1) ?? 0);
  state.headings.push({ id, text: text.replace(/`/g, ''), level });
  return `<${nestedHeadingTag(token?.tag, state.headingOffset)} id="${md.utils.escapeHtml(id)}">`;
};

md.renderer.rules.heading_close = (tokens, idx, _options, env) => {
  const state = env as unknown as RenderState;
  return `</${nestedHeadingTag(tokens[idx]?.tag, state.headingOffset)}>\n`;
};

md.renderer.rules.link_open = (tokens, idx, _options, env) => {
  const state = env as unknown as RenderState;
  const target = String(tokens[idx]?.attrGet('href') ?? '');

  if (target.startsWith('#')) {
    state.delinked.push(false);
    const anchor = docAnchorId(state.docId, slugify(target.slice(1)));
    return `<a href="#${md.utils.escapeHtml(anchor)}">`;
  }

  const doc = resolveDocTarget(state.docId, target.split('#')[0] ?? '');
  if (doc) {
    state.delinked.push(false);
    const fragment = target.includes('#') ? slugify(target.split('#')[1] ?? '') : '';
    return `<a href="${md.utils.escapeHtml(docHref(state.docId, doc, fragment))}">`;
  }

  if (/^https?:\/\//i.test(target)) {
    state.delinked.push(false);
    return `<a href="${md.utils.escapeHtml(target)}" target="_blank" rel="noopener noreferrer">`;
  }

  // Case 3: a repo path the hub cannot open. Keep the text, drop the click.
  state.delinked.push(true);
  return `<span class="doc-path" title="Not rendered here — open ${md.utils.escapeHtml(
    target,
  )} in the repo">`;
};

md.renderer.rules.link_close = (_tokens, _idx, _options, env) => {
  const state = env as unknown as RenderState;
  return state.delinked.pop() ? '</span>' : '</a>';
};

/**
 * Code blocks scroll sideways (`overflow-x: auto` in sandbox.css), and a scroll region a
 * keyboard cannot reach fails axe `scrollable-region-focusable` (TODO §D10). Wrapping
 * would avoid the tab stop but is wrong for these docs: STRUCTURE's trees and DESIGNER's
 * token-flow diagram are column-aligned, and a wrapped tree misreports nesting. So each
 * `<pre>` is a focusable, named region. The ordinal keeps names unique — a page of
 * identical `region`s fails `landmark-unique`. (RichTextEntries' tables use `group`
 * instead: lesson captions can repeat, and no build step numbers them.)
 */
function codeRegionOpen(state: RenderState, info: string): string {
  state.codeBlocks += 1;
  const file = DOC_BY_ID.get(state.docId)?.file ?? state.docId;
  const language = info.trim().split(/\s+/)[0];
  const name = `${file} code sample ${state.codeBlocks}${language ? ` (${language})` : ''}`;
  return `<pre tabindex="0" role="region" aria-label="${md.utils.escapeHtml(name)}">`;
}

for (const rule of ['fence', 'code_block'] as const) {
  const render = md.renderer.rules[rule];
  md.renderer.rules[rule] = (tokens, idx, options, env, self) => {
    const html = render?.(tokens, idx, options, env, self) ?? '';
    const open = codeRegionOpen(env as unknown as RenderState, tokens[idx]?.info ?? '');
    return html.replace(/^<pre>/, open);
  };
}

/**
 * Tables scroll sideways too (DESIGNER's Preset and Font tables at 375, TODO §D14), so
 * each sits in a focusable, named region like a `<pre>`. The wrapper does the scrolling,
 * not the `<table>`: `role="region"` on the table itself would replace its table role.
 */
md.renderer.rules.table_open = (_tokens, _idx, _options, env) => {
  const state = env as unknown as RenderState;
  state.tables += 1;
  const file = DOC_BY_ID.get(state.docId)?.file ?? state.docId;
  const name = md.utils.escapeHtml(`${file} table ${state.tables}`);
  return `<div class="doc-table-scroll" tabindex="0" role="region" aria-label="${name}">\n<table>\n`;
};

md.renderer.rules.table_close = () => '</table>\n</div>\n';

/** Render one doc's markdown, returning its HTML and the headings it contains. */
export function renderDoc(
  markdown: string,
  docId: string,
): {
  html: string;
  headings: readonly DocHeading[];
} {
  const state: RenderState = {
    docId,
    headingOffset: pageOf(docId) === HUB_PAGE ? HEADING_OFFSET : PAGE_HEADING_OFFSET,
    headings: [],
    slugCounts: new Map(),
    delinked: [],
    codeBlocks: 0,
    tables: 0,
  };
  // markdown-it types `env` as its own Env record; the renderer rules above are the
  // only readers of it, and they read it back as RenderState.
  const html = md.render(markdown, state as unknown as Record<string, unknown>);
  return { html, headings: state.headings };
}

/** Render one doc's markdown to sanitised HTML. */
export function renderDocMarkdown(markdown: string, docId: string): string {
  return renderDoc(markdown, docId).html;
}

/** Read and render every doc in the hub, in §14 order. */
export function readSandboxDocs(repoRoot: string = DEFAULT_REPO_ROOT): SandboxDocPage[] {
  return SANDBOX_DOCS.map((doc) => {
    const markdown = readFileSync(path.join(repoRoot, doc.file), 'utf-8');
    return { ...doc, ...renderDoc(markdown, doc.id) };
  });
}

/** Read and render one doc that has a debug page of its own. */
function readPageDoc(doc: SandboxDoc, repoRoot: string): SandboxDocPage {
  const markdown = readFileSync(path.join(repoRoot, doc.file), 'utf-8');
  return { ...doc, ...renderDoc(markdown, doc.id) };
}

/** Read and render docs/STYLE.md for the Code style page. */
export function readCodeStyleDoc(repoRoot: string = DEFAULT_REPO_ROOT): SandboxDocPage {
  return readPageDoc(CODE_STYLE_DOC, repoRoot);
}

/** Read and render docs/culp-syllabi/README.md for the CULP syllabi page. */
export function readCulpSyllabiDoc(repoRoot: string = DEFAULT_REPO_ROOT): SandboxDocPage {
  return readPageDoc(CULP_SYLLABI_DOC, repoRoot);
}

/** Absolute paths of the markdown files the debug pages render — the plugin's watch list. */
export function sandboxDocPaths(repoRoot: string = DEFAULT_REPO_ROOT): string[] {
  return ALL_DOCS.map((doc) => path.join(repoRoot, doc.file));
}
