/**
 * ButtonsSection — the sandbox's button reference: every `Button` variant and size,
 * with and without an icon, icon-only, and the exercise footer's three actions
 * (maintainer, 2026-10-07, after the french-lo-1 sandbox's "Buttons (Current App
 * Types)").
 *
 * IT RENDERS THE SHIPPED COMPONENTS: `Button` (`src/components/ui/button.tsx`) and
 * `ExerciseFooter`, which every exercise uses. `BUTTON_VARIANTS` / `BUTTON_SIZES` are
 * words only, so this page cannot drift from what lessons render. The `data-variant` /
 * `data-size` attributes only label each sample for `ButtonsSection.test.tsx`.
 */
import type { ReactNode } from 'react';
import { CircleCheck, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EXERCISE_BUTTONS } from '@/exercises/lib/exercise-buttons';
import { ExerciseFooter } from '@/exercises/lib/ExerciseFooter';
import { BUTTON_SIZES, BUTTON_VARIANTS } from './sandbox-catalog';

const variants = Object.entries(BUTTON_VARIANTS) as [keyof typeof BUTTON_VARIANTS, string][];
const sizes = Object.entries(BUTTON_SIZES) as [
  keyof typeof BUTTON_SIZES,
  (typeof BUTTON_SIZES)[keyof typeof BUTTON_SIZES],
][];
const textSizes = sizes.filter(([, kind]) => kind === 'text').map(([size]) => size);
const iconSizes = sizes.filter(([, kind]) => kind === 'icon').map(([size]) => size);

// The footer is static here: its handlers have nothing to act on.
const noop = () => {};

function Row({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      {note ? <p className="mt-1 max-w-(--measure) text-sm text-muted-foreground">{note}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export default function ButtonsSection() {
  return (
    <section aria-labelledby="buttons-heading" className="scroll-mt-8" id="buttons">
      <h2 id="buttons-heading" className="font-heading text-2xl font-bold">
        Buttons
      </h2>
      <p className="mt-2 max-w-(--measure) text-muted-foreground">
        <code>Button</code> (<code>src/components/ui/button.tsx</code>, shadcn on Base UI): six
        variants and eight sizes, four for text and four square icon-only ones. Icons are{' '}
        <code>lucide-react</code>, decorative, so an icon-only button needs an{' '}
        <code>aria-label</code>.
      </p>

      <div className="mt-6 grid gap-8">
        <Row title="Variants">
          {variants.map(([variant, label]) => (
            <Button key={variant} variant={variant} data-variant={variant}>
              {label}
            </Button>
          ))}
        </Row>

        <Row
          title="Colours the app uses"
          note={
            <>
              Every coloured button in a lesson, labelled with the token its colour comes from:
              solid primary (the default variant), and the exercise footer's Show answer, Reset and
              Check (<code>EXERCISE_BUTTONS</code>).
            </>
          }
        >
          <Button>--primary</Button>
          <Button {...EXERCISE_BUTTONS.showAnswer}>--primary</Button>
          <Button {...EXERCISE_BUTTONS.reset}>--destructive</Button>
          <Button {...EXERCISE_BUTTONS.check}>--success</Button>
        </Row>

        <Row title="Variants with an icon">
          {variants.map(([variant, label]) => (
            <Button key={variant} variant={variant} data-variant={variant}>
              <CircleCheck aria-hidden="true" />
              {label}
            </Button>
          ))}
        </Row>

        <Row title="Variants, icon only">
          {variants.map(([variant, label]) => (
            <Button key={variant} variant={variant} size="icon" aria-label={label}>
              <Volume2 aria-hidden="true" />
            </Button>
          ))}
        </Row>

        <Row title="Sizes">
          {textSizes.map((size) => (
            <Button key={size} size={size} data-size={size}>
              {size}
            </Button>
          ))}
        </Row>

        <Row title="Sizes with an icon">
          {textSizes.map((size) => (
            <Button key={size} size={size} data-size={size}>
              <CircleCheck aria-hidden="true" />
              {size}
            </Button>
          ))}
        </Row>

        <Row title="Sizes, icon only">
          {iconSizes.map((size) => (
            <Button key={size} size={size} data-size={size} aria-label={`Play (${size})`}>
              <Volume2 aria-hidden="true" />
            </Button>
          ))}
        </Row>

        <Row
          title="Exercise footer"
          note={
            <>
              <code>ExerciseFooter</code> (<code>src/exercises/lib/</code>), the Show answer, Reset
              and Check every exercise ends with: ghost, destructive and a success-coloured default.
            </>
          }
        >
          <div className="w-full">
            <ExerciseFooter
              onCheck={noop}
              onReset={noop}
              showReset
              onShowAnswers={noop}
              showAnswers
            />
          </div>
        </Row>
      </div>
    </section>
  );
}
