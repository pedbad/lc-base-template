/**
 * CourseHome — the course landing page (Phase D). What `/` renders.
 *
 * Before this, `/` rendered lo-00-example itself: `dist/index.html` and
 * `dist/example.html` were the same page, and a second LO's page was an orphan
 * nothing linked to. This is the index that fixes both — hero copy from
 * `course.config.ts`, a left sliding lesson nav, and one card per LO folder.
 *
 * NOTHING here enumerates LOs, and nothing authors their card text: the `lessons`
 * prop is `buildLoIndex()`'s output, built from the folders under `lo-config/` and
 * each folder's own manifest. Adding a folder adds a card, with no code change.
 *
 * The LO arrives as a PROP for the same reason `App` takes one (Part D): two entries
 * render this tree from two different readers — `main.tsx` in the browser via
 * `load-lo-glob`, `scripts/prerender.tsx` under Bun via `load-lo-disk` — so the
 * choice of reader belongs to the entry and this component stays pure.
 *
 * DOM mirrors the shell's contract (docs/specs/lo-semantic-structure.md §1): skip
 * link first, one <header>, one <main id="content" tabindex="-1">, one <h1>, and a
 * strict h1 → h2 → h3 outline (hero → "Lessons" → card titles). The one nav landmark
 * on this page is the lesson nav; there are no in-page sections to link to.
 */
import { courseConfig } from '@/config/course.config';
import { headingId } from '@/lib/headingId';
import Footer from '@/components/shell/Footer';
import ThemeToggle from '@/components/shell/ThemeToggle';
import type { LoIndexEntry } from '@/lo/lo-index';
import LessonSideNav from './LessonSideNav';
import LoCard from './LoCard';
import './home.css';

interface CourseHomeProps {
  /** Every LO in the course, in course order — one card each. */
  lessons: readonly LoIndexEntry[];
}

/** §5: the shell has ONE heading-id scheme, and it is this function. The literal
 *  'lessons-heading' that used to sit here agreed with it only by coincidence. */
const LESSONS_HEADING_ID = headingId('lessons');

export default function CourseHome({ lessons }: CourseHomeProps) {
  return (
    <>
      <a className="skip-link" href="#content">
        Skip to main content
      </a>

      {/* Deliberately NOT sticky and NOT backdrop-blurred, unlike the LO page header:
          a `backdrop-filter` makes an element the containing block for its fixed
          descendants, which would trap the sliding panel inside this bar. */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <LessonSideNav lessons={lessons} />
          {/* The brand is plain text here: this IS the page it would link to. */}
          <p className="mr-auto font-heading text-lg font-semibold tracking-tight text-foreground">
            {courseConfig.courseTitle}
          </p>
          <ThemeToggle />
        </div>
      </header>

      <main id="content" tabIndex={-1} className="mx-auto max-w-6xl px-4 focus:outline-none">
        <div className="home-hero">
          <h1 className="home-hero-heading">{courseConfig.landingCopy.heading}</h1>
          {courseConfig.landingCopy.subheading === undefined ? null : (
            <p className="home-hero-subheading">{courseConfig.landingCopy.subheading}</p>
          )}
        </div>

        <section aria-labelledby={LESSONS_HEADING_ID} className="pb-12">
          <h2
            id={LESSONS_HEADING_ID}
            className="font-heading text-2xl font-semibold text-foreground"
          >
            Lessons
          </h2>

          {lessons.length === 0 ? (
            // An honest empty state: a course mid-authoring has no cards, and saying
            // so beats an empty grid that reads as a broken page.
            <p className="mt-4 text-muted-foreground">
              This course has no lessons yet. Add a folder under <code>lo-config/</code> and it
              appears here.
            </p>
          ) : (
            <ul className="home-card-grid">
              {lessons.map((lesson, index) => (
                <LoCard key={lesson.folder} lesson={lesson} index={index} />
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
