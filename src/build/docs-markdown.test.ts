/**
 * docs-markdown.test.ts — the markdown→HTML step the sandbox docs hub renders
 * (buildlist 18, spec §14).
 *
 * §14's constraint is absolute: the five markdown docs are the SINGLE SOURCE. Edit the
 * `.md` once and GitHub and the sandbox both update, with no hand-copied prose. So the
 * interesting cases here are not "does it render bold" — they are the three ways a
 * renderer can quietly break that promise: raw HTML passing through unsanitised, a link
 * that worked on GitHub becoming a dead click, and an anchor that resolves to nothing.
 */
import { describe, expect, it } from 'vitest';
import { findHeadingViolations } from '../guards/semantic-dom';
import {
  SANDBOX_DOCS,
  docAnchorId,
  readSandboxDocs,
  renderDoc,
  renderDocMarkdown,
  slugify,
} from './docs-markdown';

const render = (markdown: string, docId = 'designer') => renderDocMarkdown(markdown, docId);

describe('slugify', () => {
  it('lowercases, strips punctuation and joins on hyphens', () => {
    expect(slugify('Job 1 — re-skin the brand (change the colours)')).toBe(
      'job-1-re-skin-the-brand-change-the-colours',
    );
  });

  it('drops backticks so a code-span heading slugs like its text', () => {
    expect(slugify('`bun run docs:tree`')).toBe('bun-run-docstree');
  });

  it('never produces a leading or trailing hyphen', () => {
    expect(slugify('— The files —')).toBe('the-files');
  });
});

describe('docAnchorId', () => {
  // Four docs on one page means four chances at a duplicate `#the-files`. The doc id
  // prefix is what makes every anchor unique across the whole hub.
  it('namespaces an anchor to its doc', () => {
    expect(docAnchorId('designer', 'the-files')).toBe('designer--the-files');
    expect(docAnchorId('structure', 'the-files')).toBe('structure--the-files');
  });

  it('is the doc id alone when there is no anchor', () => {
    expect(docAnchorId('designer', '')).toBe('designer');
  });
});

describe('renderDocMarkdown — sanitising', () => {
  // The docs are repo-authored, so this is low-risk by provenance. The default is
  // sanitised anyway: provenance is an argument about TODAY's content, and the renderer
  // outlives it.
  it('escapes raw HTML rather than passing it through', () => {
    const html = render('<script>alert(1)</script>\n\nafter');
    expect(html).not.toContain('<script');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapes an inline HTML attribute vector', () => {
    const html = render('text <img src=x onerror="alert(1)"> more');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('escapes angle brackets inside a code span without linking them', () => {
    expect(render('`src/exercises/<type>/`')).toContain('&lt;type&gt;');
  });
});

describe('renderDocMarkdown — headings', () => {
  it('gives every heading a doc-namespaced id', () => {
    expect(render('## The files')).toContain('id="designer--the-files"');
  });

  it('de-duplicates repeated headings within one doc', () => {
    const html = render('## Notes\n\n## Notes');
    expect(html).toContain('id="designer--notes"');
    expect(html).toContain('id="designer--notes-1"');
  });

  // The hub nests each doc under DocsSection's `<h3>{file}</h3>`, so a doc's `#` title
  // is an h4, not a second page `<h1>` (axe/§17, TODO §D10). The source stays `#`.
  it('renders each markdown level three below its own, under the article h3', () => {
    const html = render('# Title\n\n## Part\n\n### Detail');
    expect(html).toMatch(/<h4 id="designer--title">Title<\/h4>/);
    expect(html).toMatch(/<h5 id="designer--part">Part<\/h5>/);
    expect(html).toMatch(/<h6 id="designer--detail">Detail<\/h6>/);
    expect(html).not.toMatch(/<h[1-3][\s>]/);
  });

  it('clamps anything deeper at h6, since HTML stops there', () => {
    expect(render('#### Deep')).toMatch(/<h6 id="designer--deep">Deep<\/h6>/);
  });

  it('keeps the MARKDOWN level in the headings list, which the contents nav reads', () => {
    const { headings } = renderDoc('# Title\n\n## Part', 'designer');
    expect(headings.map((heading) => heading.level)).toEqual([1, 2]);
  });
});

describe('renderDocMarkdown — links', () => {
  it('rewrites a link to another rendered doc into that doc anchor', () => {
    expect(render('[`STRUCTURE.md`](STRUCTURE.md)')).toContain('href="#structure"');
  });

  it('keeps the fragment when a cross-doc link carries one', () => {
    expect(render('[where things go](STRUCTURE.md#where-does-my-change-go)')).toContain(
      'href="#structure--where-does-my-change-go"',
    );
  });

  it('namespaces a same-doc anchor link', () => {
    expect(render('[Job 1](#job-1)')).toContain('href="#designer--job-1"');
  });

  it('opens an external link in a new tab, with the referrer withheld', () => {
    const html = render('[bun.sh](https://bun.sh)');
    expect(html).toContain('href="https://bun.sh"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  // A path the sandbox cannot open must not become a dead click. It keeps the path as
  // text instead — and deliberately does NOT become a link to some upstream GitHub URL,
  // because this repo is a TEMPLATE and a clone's sandbox would point at the original.
  it('de-links a relative path the hub does not render, keeping the path visible', () => {
    const html = render('see [`docs/TOOLING.md`](docs/TOOLING.md) for why');
    expect(html).not.toContain('<a');
    expect(html).toContain('docs/TOOLING.md');
  });

  it('leaves link-looking text inside a fenced block alone', () => {
    const html = render('```\n[x](STRUCTURE.md)\n```');
    expect(html).not.toContain('href=');
    expect(html).toContain('[x](STRUCTURE.md)');
  });
});

describe('renderDocMarkdown — GFM shapes the docs actually use', () => {
  it('renders tables, which most of these docs are made of', () => {
    const html = render('| a | b |\n| - | - |\n| 1 | 2 |');
    expect(html).toContain('<table>');
    expect(html).toContain('<td>1</td>');
  });

  it('renders a fenced code block with its language class', () => {
    expect(render('```bash\nbun run dev\n```')).toContain('<code class="language-bash">');
  });
});

// Code blocks scroll sideways (`overflow-x: auto`), and a scroll region a keyboard
// cannot reach fails axe `scrollable-region-focusable` (TODO §D10). Wrapping was the
// other option and is wrong here: STRUCTURE's trees and DESIGNER's token-flow diagram
// are column-aligned, and a wrapped tree misreports what is inside what. So each block
// is a focusable, named region — RichTextEntries' table-scroll pattern. Names must be
// unique, or a page of identical `region`s fails axe `landmark-unique`.
describe('renderDocMarkdown — code blocks are keyboard-scrollable regions', () => {
  it('makes a fenced block a focusable region named by doc, ordinal and language', () => {
    expect(render('```bash\nbun run dev\n```')).toContain(
      '<pre tabindex="0" role="region" aria-label="DESIGNER.md code sample 1 (bash)">',
    );
  });

  it('names an untagged block without a language', () => {
    expect(render('```\ntree\n```', 'structure')).toContain(
      '<pre tabindex="0" role="region" aria-label="STRUCTURE.md code sample 1">',
    );
  });

  it('counts blocks per doc, including indented ones', () => {
    const html = render('```css\na {}\n```\n\n    indented\n');
    expect(html).toContain('aria-label="DESIGNER.md code sample 1 (css)"');
    expect(html).toContain('aria-label="DESIGNER.md code sample 2"');
  });
});

describe('readSandboxDocs', () => {
  const pages = readSandboxDocs();

  // Spec §14 names DESIGNER (designer), CONTRIBUTING (developer) and STRUCTURE
  // (project tree), with AGENTS optional. README is excluded on purpose: it is the
  // GitHub front door and opens with a raw <div align="center"> banner.
  it('renders the four docs §14 names, in that order', () => {
    expect(pages.map((page) => page.id)).toEqual([
      'designer',
      'contributing',
      'structure',
      'agents',
    ]);
    expect(SANDBOX_DOCS.map((doc) => doc.file)).not.toContain('README.md');
  });

  it('produces real HTML for each, with no script tag anywhere', () => {
    for (const page of pages) {
      expect(page.html.length, page.file).toBeGreaterThan(500);
      expect(page.html, page.file).not.toContain('<script');
    }
  });

  it('lists the headings a table of contents needs', () => {
    const designer = pages.find((page) => page.id === 'designer');
    expect(designer?.headings.length).toBeGreaterThan(5);
    expect(designer?.headings.every((heading) => heading.id.startsWith('designer--'))).toBe(true);
  });

  // Guard h's outline rule over each doc as DocsSection places it: under `<h3>{file}`.
  // The sandbox page itself is not in guard h's sweep, which is how five `<h1>` shipped.
  it('nests every doc under its article h3 with no skipped level', () => {
    for (const page of pages) {
      const article = `<h3>${page.file}</h3>${page.html}`;
      expect(findHeadingViolations(article), page.file).toEqual([]);
      expect(page.html, page.file).not.toMatch(/<h[1-3][\s>]/);
    }
  });

  it('makes every code block in the hub a focusable region with a unique name', () => {
    const pres = pages.flatMap((page) =>
      Array.from(page.html.matchAll(/<pre[^>]*>/g), (m) => m[0]),
    );
    expect(pres.length).toBeGreaterThan(0);
    expect(pres.filter((pre) => !pre.includes('tabindex="0"'))).toEqual([]);
    const names = pres.map((pre) => /aria-label="([^"]+)"/.exec(pre)?.[1]);
    expect(names.every(Boolean)).toBe(true);
    expect(new Set(names).size).toBe(names.length);
  });

  // The same check `src/docs/md-links.ts` makes of the repo, made of the rendered hub:
  // every in-page anchor points at an id that exists. This is the one that catches a
  // cross-doc link surviving into HTML with nothing to land on.
  it('resolves every in-page anchor it emits', () => {
    const combined = pages.map((page) => page.html).join('\n');
    const ids = new Set(Array.from(combined.matchAll(/id="([^"]+)"/g), (m) => m[1] as string));
    for (const doc of SANDBOX_DOCS) ids.add(doc.id);
    const targets = Array.from(combined.matchAll(/href="#([^"]+)"/g), (m) => m[1] as string);
    expect(targets.filter((target) => !ids.has(target))).toEqual([]);
  });
});
