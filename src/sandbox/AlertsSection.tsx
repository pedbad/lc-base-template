/**
 * AlertsSection — the sandbox's alert reference: info, success, warning and danger
 * (maintainer, 2026-10-07, after the french-lo-1 sandbox's "Info Variants").
 *
 * IT RENDERS `Callout`, THE COMPONENT LESSONS USE — accordion and tab instructions and
 * exercise instructions are all `Callout` too. This page exists to show what a lesson
 * renders, so it owns no styling of its own: `ALERT_EXAMPLES` is words only, and
 * `AlertsSection.test.tsx` fails if the output ever differs from a lesson's.
 */
import Callout from '@/components/shell/Callout';
import { ALERT_EXAMPLES } from './sandbox-catalog';

export default function AlertsSection() {
  return (
    <section aria-labelledby="alerts-heading" className="scroll-mt-8" id="alerts">
      <h2 id="alerts-heading" className="font-heading text-2xl font-bold">
        Alerts
      </h2>
      <p className="mt-2 max-w-(--measure) text-muted-foreground">
        <code>Callout</code> (<code>src/components/shell/Callout.tsx</code>), the one alert box
        every page uses: lesson, tab and exercise instructions are its <code>info</code> variant.
        Each variant takes its border, tint and icon from one semantic token —{' '}
        <code>--primary</code>, <code>--success</code>, <code>--warning</code>,{' '}
        <code>--destructive</code> — and keeps its text in <code>--foreground</code>.
      </p>
      <ul className="mt-6 grid gap-4">
        {ALERT_EXAMPLES.map(({ variant, title, body }) => (
          <li key={variant}>
            <Callout variant={variant} title={title}>
              {body}
            </Callout>
          </li>
        ))}
      </ul>
    </section>
  );
}
