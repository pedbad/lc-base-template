/**
 * App — the composition root (Phase C · Part A, step 3). Replaces the default Vite
 * scaffold (Rocket + count demo) with the real site shell: it builds the placeholder
 * section list and hands it to PageLayout, which renders the header/nav, main with
 * h1 + sections, and footer (spec §1). Per-section content is filled in by later
 * steps (instructions callout + demo modal, the LO accordion) and later Phase C
 * parts (real LO JSON → sections).
 */
import PageLayout from '@/components/shell/PageLayout';
import type { PageSection } from '@/components/shell/PageLayout';
import { courseConfig } from '@/config/course.config';
import { DEFAULT_SECTIONS } from '@/components/shell/sections';

const sections: PageSection[] = DEFAULT_SECTIONS.map((section) => ({ ...section }));

function App() {
  return <PageLayout title={courseConfig.courseTitle} sections={sections} />;
}

export default App;
