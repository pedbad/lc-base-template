/**
 * DocsSection — the sandbox's Docs hub (buildlist 18, spec §14).
 *
 * SPEC §14 IS THE WHOLE CONTRACT: the markdown docs are the single source of truth and
 * this page RENDERS them. Edit `DESIGNER.md` once → GitHub and the sandbox both update.
 * There is no copied prose anywhere in this file; every word below the nav comes from a
 * `.md` file in the repo root, rendered in Node by `src/build/docs-markdown.ts` and
 * handed here through the `virtual:sandbox-docs` module.
 *
 * WHY `dangerouslySetInnerHTML` IS CORRECT HERE, given the house rule against it: the
 * HTML is produced at BUILD TIME from repo-tracked files by a parser configured with
 * `html: false`, which ESCAPES raw HTML rather than passing it through. There is no user
 * input on any path into this string, and the alternative — a markdown parser and an
 * HTML-to-React pass in the browser — would ship a parser to a debug page to render
 * content that cannot change after the build.
 *
 * ALL FOUR DOCS RENDER ONTO ONE PAGE, and that is a deliberate choice over tabs or a
 * router. Every in-page anchor then resolves, cross-doc links become real anchors,
 * browser find-in-page searches the whole set at once, and there is no state to get
 * wrong. The cost is a long page — which for a reference is closer to a feature.
 */
import { SANDBOX_DOC_PAGES } from 'virtual:sandbox-docs';
import './sandbox.css';

/** Only `##`/`###` earn a contents entry — `####` is detail, and `#` is the title. */
const TOC_LEVELS = [2, 3];

export default function DocsSection() {
  return (
    <section aria-labelledby="docs-heading" className="scroll-mt-8" id="docs">
      <h2 id="docs-heading" className="font-heading text-2xl font-bold">
        Docs
      </h2>
      <p className="mt-2 max-w-prose text-muted-foreground">
        The project&rsquo;s written docs, rendered from the markdown files themselves. These are not
        copies — edit the <code>.md</code> in the repo root and this page follows on the next
        reload, which is why there is nothing here to keep in sync.
      </p>

      <nav aria-label="Docs" className="mt-6">
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
          {SANDBOX_DOC_PAGES.map((page) => (
            <li key={page.id} className="rounded-md border border-border bg-card p-4">
              <a
                className="font-semibold underline underline-offset-4 hover:no-underline"
                href={`#${page.id}`}
              >
                {page.file}
              </a>
              <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
                for the {page.audience}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{page.blurb}</p>
            </li>
          ))}
        </ul>
      </nav>

      {SANDBOX_DOC_PAGES.map((page) => (
        <article key={page.id} className="mt-12 scroll-mt-8" id={page.id}>
          <header className="border-b border-border pb-3">
            <h3 className="font-heading text-xl font-bold">{page.file}</h3>
            <p className="text-sm text-muted-foreground">
              Source: <code>{page.file}</code> — written for the {page.audience}.
            </p>
          </header>

          {page.headings.filter((heading) => TOC_LEVELS.includes(heading.level)).length > 1 && (
            <nav aria-label={`${page.file} contents`} className="mt-4">
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {page.headings
                  .filter((heading) => TOC_LEVELS.includes(heading.level))
                  .map((heading) => (
                    <li key={heading.id}>
                      <a
                        className="text-muted-foreground underline underline-offset-4 hover:no-underline"
                        href={`#${heading.id}`}
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
              </ul>
            </nav>
          )}

          {/* See the header: build-time HTML from repo-tracked markdown, parsed with
              raw HTML escaped. No runtime input reaches this string. */}
          <div className="doc-prose mt-6" dangerouslySetInnerHTML={{ __html: page.html }} />
        </article>
      ))}
    </section>
  );
}
