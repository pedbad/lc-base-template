/**
 * ClearProgress.test.tsx — forgetting a deck's saved progress (maintainer, 2026-10-12).
 * It cannot be undone, so the button asks first, in place: what will be lost, then
 * Clear or Cancel. Closed on the server and on first render, so the prerendered page
 * equals the first client render.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { ClearProgress } from './ClearProgress';

describe('ClearProgress', () => {
  test('starts as one quiet button', () => {
    const html = renderToStaticMarkup(<ClearProgress onClear={() => {}} />);
    expect(html).toMatch(/<button[^>]*>Clear saved progress<\/button>/);
    // Quiet: not the red Reset look.
    expect(html).not.toContain('bg-destructive');
    expect(html).not.toContain('Cancel');
  });

  test('asking: says what is lost, then Clear and Cancel', () => {
    const html = renderToStaticMarkup(<ClearProgress onClear={() => {}} defaultConfirming />);
    expect(html).toContain('This forgets which cards you found hard.');
    expect(html).toMatch(/>Clear<\/button>/);
    expect(html).toMatch(/>Cancel<\/button>/);
    expect(html).not.toContain('>Clear saved progress</button>');
  });
});
