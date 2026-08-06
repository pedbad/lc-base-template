/**
 * App — the page for ONE Learning Object. Nothing about the page is authored here:
 * the title, the sections, their order, their nav labels and every accordion come
 * from that LO's JSON (Phase C · Part C).
 *
 * The LO arrives as a PROP, not a module-level load, because two entries render this
 * same tree from two different readers (Part D): `main.tsx` in the browser via
 * `load-lo-glob`, and `scripts/prerender.tsx` in Node via `load-lo-disk`. Neither
 * reader's mechanism spans both runtimes, so the choice belongs to the entry — the
 * component stays reader-agnostic and pure.
 */
import PageLayout from '@/components/shell/PageLayout';
import ThemeToggle from '@/components/shell/ThemeToggle';
import type { AssembledLo } from '@/lo/assemble-lo';
import { toPageSections } from '@/lo/lo-page-sections';
import { ModalProvider } from '@/lo/rich-text/modal/ModalProvider';

interface AppProps {
  /** The loaded, validated LO this page renders. */
  lo: AssembledLo;
}

function App({ lo }: AppProps) {
  const sections = toPageSections(lo);

  // ModalProvider wraps the page because a modal link can appear in ANY section's
  // prose, and it renders the one dialog host for all of them (rich-text spec §7).
  return (
    <ModalProvider modals={lo.modals}>
      <PageLayout title={lo.title} sections={sections} themeToggle={<ThemeToggle />} />
    </ModalProvider>
  );
}

export default App;
