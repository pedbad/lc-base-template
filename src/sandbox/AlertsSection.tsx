/**
 * AlertsSection — the sandbox's alert reference: info, success, warning and danger,
 * each with its icon and colour (maintainer, 2026-10-07, after the french-lo-1 sandbox's
 * "Info Variants").
 *
 * BUILT ON THE VENDORED shadcn `Alert`, coloured here (`src/components/ui/` belongs to
 * the shadcn CLI). Each variant names ONE semantic token — `primary`, `success`,
 * `warning`, `destructive` — for its border, its tint and its icon; the body text stays
 * `foreground`, so it reads at full contrast on every tint in both themes.
 *
 * MEANING IS IN WORDS, NOT COLOUR (WCAG 1.4.1): every alert has a written title, and the
 * icon repeats it for sighted readers, so it is `aria-hidden`.
 *
 * `role="note"`, NOT THE WRAPPER'S DEFAULT `role="alert"`. These are static examples;
 * an `alert` role is a live region that interrupts a screen reader on page load. The
 * exercise instruction box makes the same override for the same reason.
 */
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ALERT_VARIANTS } from './sandbox-catalog';

export default function AlertsSection() {
  return (
    <section aria-labelledby="alerts-heading" className="scroll-mt-8" id="alerts">
      <h2 id="alerts-heading" className="font-heading text-2xl font-bold">
        Alerts
      </h2>
      <p className="mt-2 max-w-(--measure) text-muted-foreground">
        The shadcn <code>Alert</code> in four variants. Each takes its border, tint and icon from
        one semantic token — <code>--primary</code>, <code>--success</code>, <code>--warning</code>,{' '}
        <code>--destructive</code> — and keeps its text in <code>--foreground</code>.
      </p>
      <ul className="mt-6 grid gap-4">
        {ALERT_VARIANTS.map(({ id, title, body, Icon, className }) => (
          <li key={id}>
            <Alert role="note" className={`text-base text-foreground ${className}`}>
              <Icon aria-hidden="true" />
              <AlertTitle className="font-semibold">{title}</AlertTitle>
              <AlertDescription className="text-foreground">{body}</AlertDescription>
            </Alert>
          </li>
        ))}
      </ul>
    </section>
  );
}
