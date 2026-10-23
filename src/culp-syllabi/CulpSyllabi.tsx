/**
 * CulpSyllabi — the fifth debug page (`culp-syllabi.html`, DEBUG=1 only): the README of
 * docs/culp-syllabi/, which says how the CULP syllabi notes are organised and how the
 * `culp-syllabus` skill reads them, on a page of its own.
 *
 * RENDERED, NOT COPIED, as the Code style page is: `virtual:sandbox-docs` renders the
 * markdown at build time (src/build/docs-markdown.ts), so editing the README is the
 * only way to change what this page says. The notes themselves are not rendered: they
 * belong to the Language Centre and are shared for reference only (the README says so),
 * so the page explains the folder and leaves the notes in it.
 */
import { DebugPageHeader } from '@/sandbox/DebugPageHeader';
import { CULP_SYLLABI_DOC_PAGE, CULP_SYLLABI_SECTIONS } from './culp-syllabi-data';
import '@/sandbox/sandbox.css';

export default function CulpSyllabi() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <DebugPageHeader
        title="CULP syllabi"
        description="How the CULP syllabi notes in docs/culp-syllabi/ are organised, what each kind of file is for, and the skill that checks lesson material against them."
        navLabel="CULP syllabi sections"
        sections={CULP_SYLLABI_SECTIONS}
        jumpLabel="Jump to section"
        current="culp"
      />

      <main className="page-frame py-10">
        <p className="max-w-(--measure) text-muted-foreground">
          Rendered from <code>{CULP_SYLLABI_DOC_PAGE.file}</code> itself, not a copy: edit the
          markdown and this page follows on the next reload.
        </p>
        {/* Build-time HTML from a repo-tracked markdown file, parsed with raw HTML
            escaped (docs-markdown.ts). No runtime input reaches this string. */}
        <article
          className="doc-prose doc-page-prose mt-8"
          dangerouslySetInnerHTML={{ __html: CULP_SYLLABI_DOC_PAGE.html }}
        />
      </main>
    </div>
  );
}
