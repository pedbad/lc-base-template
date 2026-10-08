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
import { DebugPageHeader } from './DebugPageHeader';
import PaletteSection from './PaletteSection';
import TypographySection from './TypographySection';
import IconsSection from './IconsSection';
import ImagesSection from './ImagesSection';
import ButtonsSection from './ButtonsSection';
import AlertsSection from './AlertsSection';
import DocsSection from './DocsSection';

/** In-page nav. Ids match the `id` on each section below. */
const SECTIONS = [
  { id: 'palette', label: 'Colour' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'type', label: 'Typography' },
  { id: 'icons', label: 'Icons' },
  { id: 'images', label: 'Images' },
  { id: 'docs', label: 'Docs' },
] as const;

export default function Sandbox() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <DebugPageHeader
        title="Debug sandbox"
        description="Theme tokens, type and icons, straight from the source files. Debug-only — this page is absent from a deployed course."
        navLabel="Sandbox sections"
        sections={SECTIONS}
        jumpLabel="Jump to section"
        current="sandbox"
      />

      <main className="page-frame flex flex-col gap-14 py-10">
        <PaletteSection />
        <ButtonsSection />
        <AlertsSection />
        <TypographySection />
        <IconsSection />
        <ImagesSection />
        <DocsSection />
      </main>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        Built from <code>src/styles/palette.css</code>, <code>src/styles/tokens.css</code>,{' '}
        <code>public/icons.svg</code> and the markdown docs in the repo root. Change those, not this
        page.
      </footer>
    </div>
  );
}
