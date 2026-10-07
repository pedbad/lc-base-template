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

// §D11: the page frame grew to 72rem; widgets sized `width: 100%` stretched with it
// (conjugation inputs ~800px wide, Check a column away from the rows). Every engine
// goes through this host, so one track caps them all.
describe('ExerciseHost layout', () => {
  test('caps the engine in the exercise track', () => {
    const html = renderToStaticMarkup(
      <ExerciseHost type="word-order" config={{ ...CONFIG, type: 'word-order' }} />,
    );

    expect(html).toMatch(/<div class="exercise-track"><p[^>]*>[^<]*needs JavaScript/i);
    expect(html).toMatch(/needs JavaScript[^<]*<\/p><\/div><\/div>$/i);
  });

  // Maintainer's call 2026-10-07: select, inline-choice and radio-quiz span the column
  // like the instruction box above them; their dropdowns and pills are fixed-width, so
  // nothing stretches (§D11's bug).
  test.each([
    'select',
    'inline-choice',
    'radio-quiz',
    'inline-gap',
    'typed-transform',
    'dictation',
    'line-match',
    'memory-match',
  ] as const)('%s is not held to the track', (type) => {
    const html = renderToStaticMarkup(<ExerciseHost type={type} config={{ ...CONFIG, type }} />);

    expect(html).not.toContain('exercise-track');
  });

  test('other engines are', () => {
    const wordOrder = renderToStaticMarkup(
      <ExerciseHost type="word-order" config={{ ...CONFIG, type: 'word-order' }} />,
    );

    expect(wordOrder).toContain('<div class="exercise-track">');
  });

  // Maintainer's call 2026-10-07: the instruction box spans the whole column, so only
  // the engine is held to the track. It sits before the track, outside it.
  test('puts the instruction box above the track, not inside it', () => {
    const html = renderToStaticMarkup(<ExerciseHost type="select" config={CONFIG} />);
    const instructions = html.indexOf('drop-down');
    const engine = html.search(/needs JavaScript/i);

    expect(html).toMatch(/^<div>/);
    expect(instructions).toBeGreaterThan(-1);
    expect(engine).toBeGreaterThan(instructions);
  });
});
