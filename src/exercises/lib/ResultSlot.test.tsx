/**
 * ResultSlot.test.tsx — the per-row tick / cross every row engine shows after Check.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { ResultSlot } from './ResultSlot';

describe('ResultSlot', () => {
  test('is empty until the row is graded', () => {
    expect(renderToStaticMarkup(<ResultSlot hasResult={false} isCorrect={false} />)).not.toContain(
      '<svg',
    );
  });

  // Maintainer's call 2026-10-07: circled marks (lucide circle-check-big / circle-x)
  // at the 2rem of the alert icons (Callout).
  test.each([
    [true, 'lucide-circle-check-big', 'text-success'],
    [false, 'lucide-circle-x', 'text-destructive'],
  ])('isCorrect=%s draws a 2rem %s in %s', (isCorrect, icon, colour) => {
    const html = renderToStaticMarkup(<ResultSlot hasResult isCorrect={isCorrect} />);

    expect(html).toMatch(new RegExp(`<svg[^>]*class="[^"]*\\b${icon}\\b`));
    expect(html).toMatch(new RegExp(`<svg[^>]*class="[^"]*\\bsize-8\\b[^"]*${colour}`));
  });

  // The icons are decorative (aria-hidden), so a screen reader used to hear only the
  // progress count, not which row was wrong (TODO §E12b, decided 2026-10-16). Each
  // graded row now says its verdict in words, with the same labels the course uses.
  test.each([
    [true, 'Correct!'],
    [false, 'Incorrect'],
  ])('isCorrect=%s also says %s to a screen reader', (isCorrect, words) => {
    const html = renderToStaticMarkup(<ResultSlot hasResult isCorrect={isCorrect} />);

    expect(html).toContain(`<span class="sr-only">${words}</span>`);
  });

  test('says nothing to a screen reader until the row is graded', () => {
    const html = renderToStaticMarkup(<ResultSlot hasResult={false} isCorrect={false} />);

    expect(html).not.toContain('sr-only');
  });
});
