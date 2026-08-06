/**
 * Tests for ExerciseHost's SERVER output (Part D). An engine is a lazy component, so
 * it cannot resolve during `renderToString` — the host must therefore emit a
 * deliberate, honest placeholder rather than a Suspense boundary that fails on the
 * server and is thrown away by the client (React error #419).
 *
 * The instruction box is NOT lazy and must survive into the static page.
 */
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExerciseHost } from './ExerciseHost';

const CONFIG = { type: 'select', title: 'Placeholder', content: {} };

describe('ExerciseHost server rendering', () => {
  test('renders the instruction box into the static page', () => {
    const html = renderToStaticMarkup(<ExerciseHost type="select" config={CONFIG} />);

    expect(html).toContain('<p');
    expect(html.length).toBeGreaterThan(0);
  });

  test('states the exercise needs JavaScript instead of suspending', () => {
    const html = renderToStaticMarkup(<ExerciseHost type="select" config={CONFIG} />);

    expect(html).toMatch(/needs JavaScript/i);
    expect(html).not.toContain('Loading…');
  });
});
