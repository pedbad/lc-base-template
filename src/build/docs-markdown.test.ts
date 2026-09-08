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
import {
  SANDBOX_DOCS,
  docAnchorId,
  readSandboxDocs,
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
