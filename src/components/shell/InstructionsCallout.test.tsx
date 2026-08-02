/**
 * Tests for InstructionsCallout (Phase C · Part A, step 4 — spec §3). The critical
 * assertion is the semantics: a plain <div class="instructions">, NOT role="alert".
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import InstructionsCallout from './InstructionsCallout';

describe('InstructionsCallout', () => {
  test('renders a div carrying the shared "instructions" class', () => {
    const html = renderToStaticMarkup(<InstructionsCallout>Read carefully.</InstructionsCallout>);
    expect(html).toMatch(/<div[^>]*class="[^"]*instructions/);
    expect(html).toContain('Read carefully.');
  });

  test('is NOT an assertive live region (no role="alert" — §3)', () => {
    const html = renderToStaticMarkup(
      <InstructionsCallout>Static instructions.</InstructionsCallout>,
    );
    expect(html).not.toContain('role="alert"');
  });
});
