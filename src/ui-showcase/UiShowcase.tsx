/**
 * UiShowcase.tsx — the UI showcase (TODO §F4): every block type the course page can
 * render, grouped by type, each in both presentations.
 *
 * Every item renders through `LoBlock`, the component the course page itself uses, so
 * what is seen here is what an LO shows. The example LO's own blocks come first, then
 * any authored fixture, then the presentation the example lacks (block-groups.ts). The
 * page sits inside the example LO's modal and hover providers, so a popup or hover card
 * its rich text links to opens here as it does on the page.
 *
 * An item's caption is a paragraph, not a heading: a plain block's own headings start
 * at `<h3>`, directly under the section's `<h2>`, exactly as on the course page.
 */
import { LoBlock } from '@/lo/LoBlock';
import { HoverProvider } from '@/lo/rich-text/hover/hover-context';
import { ModalProvider } from '@/lo/rich-text/modal/ModalProvider';
import { DebugPageHeader } from '@/sandbox/DebugPageHeader';
import { EXAMPLE_LO, UI_SHOWCASE_GROUPS, UI_SHOWCASE_SECTIONS } from './ui-showcase-data';

export default function UiShowcase() {
  return (
    <ModalProvider modals={EXAMPLE_LO.modals}>
      <HoverProvider hovers={EXAMPLE_LO.hovers}>
        <div className="min-h-dvh bg-background text-foreground">
          <DebugPageHeader
            title="UI Showcase"
            description="Every block type the course page renders, through the page's own renderers, as a plain block and as a card."
            navLabel="UI showcase sections"
            sections={UI_SHOWCASE_SECTIONS}
            jumpLabel="Jump to block type"
            current="ui"
          />

          <main className="page-frame flex flex-col gap-16 py-10">
            {UI_SHOWCASE_GROUPS.map((group) => (
              <section
                key={group.type}
                id={group.type}
                aria-labelledby={`${group.type}-heading`}
                className="scroll-mt-6"
              >
                <h2 id={`${group.type}-heading`} className="font-heading text-2xl font-bold">
                  {group.label}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Block type <code>{group.type}</code>
                </p>
                <div className="mt-6 flex flex-col gap-10">
                  {group.items.map((item) => (
                    <div key={item.id} id={item.id} className="scroll-mt-6">
                      <p className="mb-3 border-b border-dashed border-border pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        {item.caption}
                      </p>
                      <LoBlock id={`block-${item.id}`} config={item.config} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </main>
        </div>
      </HoverProvider>
    </ModalProvider>
  );
}
