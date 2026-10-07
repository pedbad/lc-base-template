/**
 * Callout.test.tsx — the ONE tinted alert every page uses: accordion and tab
 * instructions, exercise instructions, and the debug sandbox's reference.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import Callout from './Callout';

const VARIANT_TOKENS = [
  ['success', 'success'],
  ['warning', 'warning'],
  ['danger', 'destructive'],
] as const;

describe('Callout', () => {
  test('defaults to info', () => {
    const html = renderToStaticMarkup(<Callout>Read carefully.</Callout>);

    expect(html).toContain('border-primary/40');
    expect(html).toContain('Read carefully.');
  });

  test.each(VARIANT_TOKENS)('%s takes border, tint and icon from --%s', (variant, token) => {
    const html = renderToStaticMarkup(<Callout variant={variant}>Body.</Callout>);

    expect(html).toContain(`border-${token}/40`);
    expect(html).toContain(`bg-${token}/10`);
    expect(html).toContain(`text-${token}`);
  });

  // Maintainer's call 2026-10-07: info boxes are Cambridge Light Blue, through the
  // --callout-info token (tokens.css), which keeps the old primary tint in dark mode.
  test('info is tinted --callout-info, with a --primary border and icon', () => {
    const html = renderToStaticMarkup(<Callout variant="info">Body.</Callout>);

    expect(html).toContain('bg-callout-info');
    expect(html).not.toContain('bg-primary/10');
    expect(html).toContain('border-primary/40');
    expect(html).toContain('text-primary');
  });

  // Maintainer's call 2026-10-07: every alert icon at twice the shadcn 16px.
  test.each(['info', 'success', 'warning', 'danger'] as const)(
    'the %s icon is 2rem (size-8)',
    (variant) => {
      const html = renderToStaticMarkup(<Callout variant={variant}>Body.</Callout>);

      expect(html).toMatch(/<svg[^>]*class="[^"]*\bsize-8\b/);
    },
  );

  test('is a note, never an assertive live region', () => {
    const html = renderToStaticMarkup(<Callout variant="danger">Static.</Callout>);

    expect(html).toContain('role="note"');
    expect(html).not.toContain('role="alert"');
  });

  test('the icon is decorative; the words carry the meaning', () => {
    const html = renderToStaticMarkup(<Callout title="Warning">Body.</Callout>);

    expect(html.match(/<svg/g)).toHaveLength(1);
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(html).toContain('>Warning<');
  });

  test('renders no title element when none is given', () => {
    const html = renderToStaticMarkup(<Callout>Body.</Callout>);

    expect(html).not.toContain('data-slot="alert-title"');
  });

  test('merges a caller class without losing the variant', () => {
    const html = renderToStaticMarkup(<Callout className="instructions mb-3">Body.</Callout>);

    expect(html).toMatch(/class="[^"]*\binstructions\b/);
    expect(html).toContain('border-primary/40');
  });
});
