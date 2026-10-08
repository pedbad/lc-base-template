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
import { EXERCISE_TYPE_KEYS } from '@/config/exercise-types';
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

// §D11 put every engine on a 48rem track: widgets sized `width: 100%` stretched with
// the 72rem frame. The maintainer then moved them off it engine by engine (§D12,
// 2026-10-07/08) and the last four — word-spot, word-order, phrase-reorder,
// drag-fill-gaps — on 2026-10-08 (§D13), so the track is gone: every engine spans the
// column, like the instruction box above it.
describe('ExerciseHost layout', () => {
  test.each(EXERCISE_TYPE_KEYS)('%s spans the column: no track holds it', (type) => {
    const html = renderToStaticMarkup(<ExerciseHost type={type} config={{ ...CONFIG, type }} />);

    expect(html).not.toContain('exercise-track');
    // The engine's slot sits straight inside the host's one wrapper.
    expect(html).toMatch(/needs JavaScript[^<]*<\/p><\/div>$/i);
    expect(html).not.toMatch(/needs JavaScript[^<]*<\/p><\/div><\/div>$/i);
  });

  test('puts the instruction box above the engine', () => {
    const html = renderToStaticMarkup(<ExerciseHost type="select" config={CONFIG} />);
    const instructions = html.indexOf('drop-down');
    const engine = html.search(/needs JavaScript/i);

    expect(html).toMatch(/^<div>/);
    expect(instructions).toBeGreaterThan(-1);
    expect(engine).toBeGreaterThan(instructions);
  });
});
