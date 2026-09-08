/**
 * TypographySection — the type half of the sandbox (buildlist 16).
 *
 * TWO FAMILIES, AND THE POINT IS WHAT HAPPENS WHEN ONE IS MISSING. Feijoa is commercial
 * and git-ignored, so on a fresh clone `--font-display` falls through to Open Sans and
 * both specimens below look identical. That is correct, and seeing it is the fastest way
 * to know whether the fonts are installed — which is otherwise invisible until a heading
 * looks wrong in a screenshot.
 *
 * SIZES ARE TAILWIND STEPS, never raw lengths: `rem` scales with the reader's browser
 * font size and `px` does not, which is why guard f bans raw `px` in the token chain.
 */
import { TYPE_SCALE, TYPE_SPECIMENS } from './sandbox-catalog';

const SPECIMEN_TEXT = 'Bonjour — the quick brown fox jumps over the lazy dog. 0123456789';

export default function TypographySection() {
  return (
    <section aria-labelledby="type-heading" className="scroll-mt-8" id="type">
      <h2 id="type-heading" className="font-heading text-2xl font-bold">
        Typography
      </h2>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Both families are declared in <code>palette.css</code>, not in a preset file, so switching
        the primary preset never moves the type. If the two specimens below look the same, Feijoa is
        not installed — see DESIGNER.md, &ldquo;Feijoa is never committed&rdquo;.
      </p>

      <ul className="mt-6 flex flex-col gap-6">
        {TYPE_SPECIMENS.map((specimen) => (
          <li key={specimen.font} className="rounded-md border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">{specimen.label}</h3>
            <p className="text-sm text-muted-foreground">{specimen.note}</p>
            <p className={`mt-3 text-2xl ${specimen.utility}`}>{SPECIMEN_TEXT}</p>
            <p className="mt-3 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
              <code>{specimen.font}</code>
              <code>.{specimen.utility}</code>
            </p>
          </li>
        ))}
      </ul>

      <h3 className="mt-10 font-heading text-lg font-semibold">The scale</h3>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        The four steps the course actually uses. Zoom the browser to 200% — every one of them should
        grow, because none is a pixel length.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {TYPE_SCALE.map((step) => (
          <li key={step.utility} className="flex flex-wrap items-baseline gap-x-4">
            <span className={step.utility}>{step.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
