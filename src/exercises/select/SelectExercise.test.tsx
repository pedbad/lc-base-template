/**
 * SelectExercise.test.tsx — width of the two layout modes. select is a full-width
 * engine (ExerciseHost's FULL_WIDTH_TYPES): its rows and its inline passage both span
 * the column.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import SelectExercise from './SelectExercise';
import { selectFixtures } from './select.fixture';

const render = (id: string) => {
  const fixture = selectFixtures.find((f) => f.id === id);
  if (!fixture) throw new Error(`no fixture ${id}`);
  return renderToStaticMarkup(<SelectExercise config={fixture.config} />);
};

describe('SelectExercise width', () => {
  test('rows mode is not capped', () => {
    expect(render('select-rows')).toMatch(/^<div class="flex flex-col gap-4">/);
  });

  // Maintainer's call 2026-10-07: the passage card spans the column too.
  test('inline-passage mode is not capped either', () => {
    expect(render('select-inline')).toMatch(/^<div class="flex flex-col gap-4">/);
  });
});
