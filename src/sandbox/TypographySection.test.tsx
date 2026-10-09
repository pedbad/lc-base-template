/**
 * TypographySection.test.tsx — the sandbox's type reference.
 *
 * TODO §D14 (2026-10-09): links are type too. The section shows a plain link and a
 * hover term, rendered from the showcase's rich-text fixture rather than a copy.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import TypographySection from './TypographySection';

describe('TypographySection', () => {
  const html = renderToStaticMarkup(<TypographySection />);

  test('shows a plain link, opening in a new tab', () => {
    expect(html).toMatch(/<a [^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
  });

  test('shows a hover term', () => {
    expect(html).toMatch(/<button type="button" class="hover-term" aria-expanded="false">/);
  });
});
