/**
 * Footer — the shell's plain <footer> landmark (Phase C · Part A, step 2).
 * Placeholder links + copyright. Per spec §5 there is deliberately NO heading
 * element anywhere inside (a decorative <h2> in the footer was a french-lo-1
 * mistake that broke strict heading-outline checks — not repeated here).
 */
import { courseConfig } from '@/config/course.config';

const FOOTER_LINKS = [
  { href: '#content', label: 'Back to top' },
  { href: '#', label: 'Accessibility' },
  { href: '#', label: 'Privacy' },
] as const;

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {courseConfig.courseTitle}. Placeholder footer — real links land in a later Phase C
          part.
        </p>
        <ul className="flex flex-wrap gap-4">
          {FOOTER_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="rounded-sm underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
