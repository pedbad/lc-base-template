/**
 * RichTextShowcase — the rich-text authoring reference on the showcase page (spec §14).
 *
 * Every block-entry kind rendered as page prose renders it, a button opening the same
 * entries as a popup (popups accept exactly what prose accepts), and the authored
 * source underneath so an author can copy a working shape. Content and parsing live in
 * rich-text-fixture.ts.
 */
import { ModalProvider } from '@/lo/rich-text/modal/ModalProvider';
import { ModalLink } from '@/lo/rich-text/modal/ModalLink';
import type { ModalContent } from '@/lo/rich-text/modal/modal-context';
import { RichTextEntries } from '@/lo/rich-text/RichTextEntries';
import { RICH_TEXT_SHOWCASE_ENTRIES, RICH_TEXT_SHOWCASE_SOURCE } from './rich-text-fixture';

const MODAL: ModalContent = {
  id: 'showcase-rich-text',
  title: 'Rich text in a popup',
  content: RICH_TEXT_SHOWCASE_ENTRIES,
};

export default function RichTextShowcase() {
  return (
    <ModalProvider modals={{ [MODAL.id]: MODAL }}>
      <article id="rich-text" className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Rich text &amp; popups</h2>
        <div className="space-y-3">
          <RichTextEntries entries={RICH_TEXT_SHOWCASE_ENTRIES} />
          <p>
            <ModalLink target={MODAL.id}>Open the same content as a popup</ModalLink>
          </p>
        </div>
        <details className="mt-6">
          <summary className="cursor-pointer font-medium">Authored source</summary>
          <pre className="mt-3 rounded-md bg-muted p-4 text-sm break-all whitespace-pre-wrap">
            <code>{JSON.stringify(RICH_TEXT_SHOWCASE_SOURCE, null, 2)}</code>
          </pre>
        </details>
      </article>
    </ModalProvider>
  );
}
