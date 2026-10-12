/**
 * ExerciseFooter.test.tsx — the shared button row. Check is optional (maintainer,
 * 2026-10-12): memory-match self-checks, so it renders Show answers · Reset only, in
 * the same looks as every other engine.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ExerciseFooter } from './ExerciseFooter';

const noop = () => {};

describe('ExerciseFooter', () => {
  it('reads Show answers · Reset · Check, each with its glyph', () => {
    const html = renderToStaticMarkup(
      <ExerciseFooter onCheck={noop} onReset={noop} showReset onShowAnswers={noop} showAnswers />,
    );
    const order = [...html.matchAll(/lucide-(eye|rotate-ccw|circle-check)/g)].map((m) => m[1]);
    expect(order).toEqual(['eye', 'rotate-ccw', 'circle-check']);
  });

  it('renders no Check without onCheck', () => {
    const html = renderToStaticMarkup(
      <ExerciseFooter onReset={noop} showReset onShowAnswers={noop} showAnswers />,
    );
    expect(html).not.toContain('lucide-circle-check');
    expect(html).toContain('lucide-eye');
    expect(html).toContain('lucide-rotate-ccw');
  });
});
