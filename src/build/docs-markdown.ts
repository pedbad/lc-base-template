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
 * costs nothing here: the three rendered docs contain no raw HTML at all. (README does,
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

const DOC_BY_FILE = new Map(SANDBOX_DOCS.map((doc) => [doc.file, doc]));

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
  readonly headings: DocHeading[];
  readonly slugCounts: Map<string, number>;
  /** Whether each open link was de-linked, so `link_close` closes the right tag. */
  readonly delinked: boolean[];
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

/** The doc a link target refers to, if the hub renders it. */
function resolveDocTarget(target: string): SandboxDoc | undefined {
  return DOC_BY_FILE.get(stripRelativePrefix(target));
}

const md = new MarkdownIt({
  // Raw HTML is ESCAPED, not passed through — the sanitising decision, in one flag.
  html: false,
  // Bare URLs stay bare: the docs write their links out, and auto-linking prose is a
  // second way for a link to appear that nothing here reviewed.
  linkify: false,
  typographer: false,
});

md.renderer.rules.heading_open = (tokens, idx, _options, env) => {
  const state = env as unknown as RenderState;
  const token = tokens[idx];
  const text = tokens[idx + 1]?.content ?? '';
  const id = docAnchorId(state.docId, uniqueAnchor(state, text));
  const level = Number(token?.tag?.slice(1) ?? 0);
  state.headings.push({ id, text: text.replace(/`/g, ''), level });
  return `<${token?.tag ?? 'h2'} id="${md.utils.escapeHtml(id)}">`;
};

md.renderer.rules.link_open = (tokens, idx, _options, env) => {
  const state = env as unknown as RenderState;
  const target = String(tokens[idx]?.attrGet('href') ?? '');

  if (target.startsWith('#')) {
    state.delinked.push(false);
    const anchor = docAnchorId(state.docId, slugify(target.slice(1)));
    return `<a href="#${md.utils.escapeHtml(anchor)}">`;
  }

  const doc = resolveDocTarget(target.split('#')[0] ?? '');
  if (doc) {
    state.delinked.push(false);
    const fragment = target.includes('#') ? slugify(target.split('#')[1] ?? '') : '';
    const anchor = docAnchorId(doc.id, fragment);
    return `<a href="#${md.utils.escapeHtml(anchor)}">`;
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

/** Render one doc's markdown, returning its HTML and the headings it contains. */
export function renderDoc(
  markdown: string,
  docId: string,
): {
  html: string;
  headings: readonly DocHeading[];
} {
  const state: RenderState = { docId, headings: [], slugCounts: new Map(), delinked: [] };
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

/** Absolute paths of the markdown files the hub renders — for the plugin's watch list. */
export function sandboxDocPaths(repoRoot: string = DEFAULT_REPO_ROOT): string[] {
  return SANDBOX_DOCS.map((doc) => path.join(repoRoot, doc.file));
}
