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

  // Maintainer's call 2026-10-07: the marks match the 2rem alert icons (Callout).
  test.each([
    [true, 'text-success'],
    [false, 'text-destructive'],
  ])('isCorrect=%s draws a 2rem %s mark', (isCorrect, colour) => {
    const html = renderToStaticMarkup(<ResultSlot hasResult isCorrect={isCorrect} />);

    expect(html).toMatch(new RegExp(`<svg[^>]*class="[^"]*\\bsize-8\\b[^"]*${colour}`));
  });
});
