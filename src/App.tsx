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
import LoAccordion from '@/components/shell/LoAccordion';
import ThemeToggle from '@/components/shell/ThemeToggle';
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
  grammar: (
    <div className="space-y-3">
      <LoAccordion
        id="grammar-1"
        title="Placeholder grammar item"
        instructions="How this block works."
      >
        <p className="text-muted-foreground">
          Grammar block body. A real block renders target-language prose here.
        </p>
      </LoAccordion>
    </div>
  ),
  exercises: (
    <div className="space-y-3">
      <LoAccordion id="ex-1" title="Placeholder exercise" defaultOpen>
        <p className="text-muted-foreground">Exercise body. A real exercise engine mounts here.</p>
      </LoAccordion>
    </div>
  ),
};

const sections: PageSection[] = DEFAULT_SECTIONS.map((section) => ({
  ...section,
  content: SECTION_CONTENT[section.id],
}));

function App() {
  return (
    <PageLayout
      title={courseConfig.courseTitle}
      sections={sections}
      themeToggle={<ThemeToggle />}
    />
  );
}

export default App;
