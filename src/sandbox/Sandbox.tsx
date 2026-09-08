/**
 * Sandbox.tsx — the debug sandbox (dev artifact #1, buildlist 16, spec §14).
 *
 * WHO IT IS FOR. The designer. DESIGNER.md explains what may be edited; this page shows
 * it — every colour token as a swatch, both font families as specimens, the icon sprite
 * as pictures. Reading a token chain in three stylesheets and reading it as squares are
 * very different jobs, and only one of them can be done by someone who does not open the
 * repo in an editor.
 *
 * IT IS A DEBUG ARTIFACT AND MUST NOT SHIP. Opt-in per build (`DEBUG=1 bun run build`),
 * behind the same fail-closed flag as the exercise showcase — see build-entries.ts for
 * why one flag covers both. The dev server serves it unconditionally, which is where it
 * is meant to be read.
 *
 * NOT PRERENDERED, and that is the one deliberate difference from every other page here.
 * The course pages are prerendered so they read without JavaScript; this page has an
 * audience of one and a JavaScript requirement costs that audience nothing. It is
 * therefore also outside guard h's rendered-output sweep, by the same reasoning.
 *
 * WHY `src/sandbox/` AND NOT `src/showcase/`: the showcase is one thing — fixtures
 * through ExerciseHost. Folding a token reference, a type specimen, an icon sprite and a
 * docs hub into it would leave a folder whose name describes a quarter of its contents.
 */
import { resolveAsset, resolveHomeHref } from '@/lib/assets';
import ThemeToggle from '@/components/shell/ThemeToggle';
import PaletteSection from './PaletteSection';
import TypographySection from './TypographySection';
import IconsSection from './IconsSection';

/** In-page nav. Ids match the `id` on each section below. */
const SECTIONS = [
  { id: 'palette', label: 'Colour' },
  { id: 'type', label: 'Typography' },
  { id: 'icons', label: 'Icons' },
] as const;

export default function Sandbox() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <h1 className="font-heading text-3xl font-bold">Debug sandbox</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Theme tokens, type and icons, straight from the source files. Debug-only — this page
              is absent from a deployed course.
            </p>
          </div>
          <ThemeToggle />
        </div>
        <nav aria-label="Sandbox sections" className="mx-auto max-w-5xl px-6 pb-4">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  className="underline underline-offset-4 hover:no-underline"
                  href={`#${section.id}`}
                >
                  {section.label}
                </a>
              </li>
            ))}
            <li>
              <a
                className="underline underline-offset-4 hover:no-underline"
                href={resolveAsset('exercise-showcase.html')}
              >
                Exercise showcase
              </a>
            </li>
            <li>
              <a
                className="underline underline-offset-4 hover:no-underline"
                href={resolveHomeHref()}
              >
                Course home
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-14 px-6 py-10">
        <PaletteSection />
        <TypographySection />
        <IconsSection />
      </main>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        Built from <code>src/styles/palette.css</code>, <code>src/styles/tokens.css</code> and{' '}
        <code>public/icons.svg</code>. Change those, not this page.
      </footer>
    </div>
  );
}
