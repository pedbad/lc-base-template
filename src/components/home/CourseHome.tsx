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
 *
 * THERE IS NO TOP BAR, AND <header> IS NOW AN EMPTY-LOOKING WRAPPER ON PURPOSE
 * (§D · D7). The landing page's chrome is the left rail; a bar above it was a second
 * piece of furniture holding one title and one toggle, and both found better homes —
 * the title in the hero below, the toggle in the rail.
 *
 * The <header> element STAYS because §17 puts the page's primary nav inside it and
 * guard h enforces that (it caught an earlier shape with `nav-outside-header`). It
 * carries no styling and every child it has is `position: fixed`, so it collapses to
 * zero height and paints nothing of its own — which is also why it must NOT be given a
 * background, a border or a `backdrop-filter`: a `backdrop-filter` in particular would
 * make it the containing block for those fixed descendants and pin the rail and the
 * panel inside a zero-height box.
 *
 * THE COURSE TITLE IS AN <hgroup> SUBTITLE, NOT A HEADING. `courseTitle` and the hero
 * subheading are both styled prominently and neither is a section heading — the outline
 * is h1 (hero) → h2 ("Lessons") → h3 (card titles), and inserting either would break it.
 * `<hgroup>` is the element the HTML Living Standard defines for exactly this: one
 * h1–h6 plus any number of <p> that qualify it. That makes the relationship explicit
 * instead of leaving two floating styled paragraphs for a checker to guess at.
 */
import { courseConfig } from '@/config/course.config';
import { headingId } from '@/lib/heading-id';
import BackToTopButton from '@/components/shell/BackToTopButton';
import Footer from '@/components/shell/Footer';
import type { LoIndexEntry } from '@/lo/lo-index';
import LessonRail from './LessonRail';
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

      <div className="home-shell">
        {/* Unstyled and zero-height by design — see the note above. LessonRail is its
            child for §17's sake, not for layout's: it paints itself against the
            viewport edge. */}
        <header>
          <LessonRail lessons={lessons} />
        </header>

        <main
          id="content"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 focus:outline-none"
        >
          <hgroup className="home-hero">
            {/* The course name, which used to be the top bar's only content. An
                <hgroup> <p> BEFORE the heading is the standard eyebrow shape, and it
                is where the page says which course this is. */}
            <p className="home-hero-eyebrow">{courseConfig.courseTitle}</p>
            <h1 className="home-hero-heading">{courseConfig.landingCopy.heading}</h1>
            {courseConfig.landingCopy.subheading === undefined ? null : (
              <p className="home-hero-subheading">{courseConfig.landingCopy.subheading}</p>
            )}
          </hgroup>

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
              <>
                <ul className="home-card-grid">
                  {lessons.map((lesson, index) => (
                    <LoCard key={lesson.folder} lesson={lesson} index={index} />
                  ))}
                </ul>
                {/* §D · D2, and only in this branch: the zero-lesson state is a
                    single honest sentence, so a back-to-top under it would be
                    absurd. The case here is stronger than on an LO page — this
                    header is deliberately not sticky, so nothing follows the
                    reader down a long grid. */}
                <BackToTopButton sectionId="lessons" />
              </>
            )}
          </section>
        </main>

        {/* Inside the shell, not after it: the rail is fixed and full-height, so a
            footer outside this padding would run underneath it. */}
        <Footer />
      </div>
    </>
  );
}
