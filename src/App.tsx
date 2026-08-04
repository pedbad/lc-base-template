/**
 * App — the composition root. It loads ONE Learning Object from `lo-config/` and
 * hands its sections to PageLayout. Nothing about the page is authored here: the
 * title, the sections, their order, their nav labels and every accordion come from
 * that LO's JSON (Phase C · Part C).
 *
 * `loadLo` throws if the LO is malformed, naming the offending file — so a broken LO
 * fails at load with a precise message instead of rendering a half page.
 *
 * Which LO renders is still fixed here. Per-LO pages arrive with Part D, where the
 * post-build pre-render walks every folder in `lo-config/` and emits one HTML file
 * each; this constant is the single-page stand-in until then.
 */
import PageLayout from '@/components/shell/PageLayout';
import ThemeToggle from '@/components/shell/ThemeToggle';
import { loadLo } from '@/lo/load-lo-glob';
import { toPageSections } from '@/lo/lo-page-sections';

/** The LO this page renders, by folder name under `lo-config/`. */
const LO_SLUG = 'lo-00-example';

const lo = loadLo(LO_SLUG);
const sections = toPageSections(lo);

function App() {
  return <PageLayout title={lo.title} sections={sections} themeToggle={<ThemeToggle />} />;
}

export default App;
