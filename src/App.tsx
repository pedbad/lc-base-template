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
import InstructionsCallout from '@/components/shell/InstructionsCallout';
import DemoModal from '@/components/shell/DemoModal';
import { courseConfig } from '@/config/course.config';
import { DEFAULT_SECTIONS } from '@/components/shell/sections';

/** Per-section placeholder content. The introduction shows the two chrome demos
 *  (instructions callout + demo modal) so authors can see what they look like. */
const SECTION_CONTENT: Record<string, PageSection['content']> = {
  introduction: (
    <div className="space-y-4">
      <InstructionsCallout>
        Instructions render as a plain callout — informative, never an assertive announcement.
      </InstructionsCallout>
      <p className="text-muted-foreground">
        Placeholder introduction. Real Learning Object content is stitched in by later Phase C
        parts.
      </p>
      <DemoModal />
    </div>
  ),
};

const sections: PageSection[] = DEFAULT_SECTIONS.map((section) => ({
  ...section,
  content: SECTION_CONTENT[section.id],
}));

function App() {
  return <PageLayout title={courseConfig.courseTitle} sections={sections} />;
}

export default App;
