/**
 * CodeStyle — the fourth debug page (`code-style.html`, DEBUG=1 only): docs/STYLE.md,
 * how the code is written, with its examples, on a page of its own.
 *
 * RENDERED, NOT COPIED. The page holds no prose: `virtual:sandbox-docs` renders the
 * markdown at build time (src/build/docs-markdown.ts), exactly as the sandbox's docs
 * hub does, so editing STYLE.md is the only way to change what this page says. The
 * guide gets its own page rather than a fifth article in the hub because it is read
 * while writing code, from the nav every debug page shares, not browsed with the
 * designer's docs. Its links to a hub doc open the sandbox at that doc.
 */
import { DebugPageHeader } from '@/sandbox/DebugPageHeader';
import { CODE_STYLE_DOC_PAGE, CODE_STYLE_SECTIONS } from './code-style-data';
import '@/sandbox/sandbox.css';

export default function CodeStyle() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <DebugPageHeader
        title="Code style"
        description="How the code is written: what the tools enforce, and the habits they do not, with real examples from src/."
        navLabel="Code style sections"
        sections={CODE_STYLE_SECTIONS}
        jumpLabel="Jump to section"
        current="style"
      />

      <main className="page-frame py-10">
        <p className="max-w-(--measure) text-muted-foreground">
          Rendered from <code>{CODE_STYLE_DOC_PAGE.file}</code> itself, not a copy: edit the
          markdown and this page follows on the next reload.
        </p>
        {/* Build-time HTML from a repo-tracked markdown file, parsed with raw HTML
            escaped (docs-markdown.ts). No runtime input reaches this string. */}
        <article
          className="doc-prose doc-page-prose mt-8"
          dangerouslySetInnerHTML={{ __html: CODE_STYLE_DOC_PAGE.html }}
        />
      </main>
    </div>
  );
}
