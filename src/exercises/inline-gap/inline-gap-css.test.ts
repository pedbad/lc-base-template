/**
 * inline-gap-css.test.ts — the feedback line hangs under its blank without widening it
 * (maintainer, 2026-10-09; TODO §D15). hang-under.ts decides where; this sheet makes the
 * line take no width from the blank and reads the two numbers the engine sets.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const read = (name: string) => readFileSync(path.join(import.meta.dirname, name), 'utf8');
const css = read('inline-gap.css');

describe('inline-gap.css', () => {
  test('lives in the components layer', () => {
    expect(css).toMatch(/@layer components\s*\{/);
  });

  test('the blank sits on the baseline, so feedback grows it downward only', () => {
    expect(css).toMatch(/\.gap-blank\s*\{[^}]*vertical-align: baseline;/);
    expect(read('InlineTypedGapExercise.tsx')).toMatch(
      /className="gap-blank [^"]*inline-flex flex-col"/,
    );
  });

  test('the hang adds no width to the blank', () => {
    expect(css).toMatch(/\.gap-hang\s*\{[^}]*contain: inline-size;/);
  });

  test('its line sizes to its text, capped, and moves by the offset the engine sets', () => {
    const line = /\.gap-hang > \*\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(line).toMatch(/inline-size: max-content;/);
    expect(line).toMatch(/max-inline-size: var\(--gap-hang-max, [\d.]+rem\);/);
    expect(line).toMatch(/position: relative;/);
    expect(line).toMatch(/inset-inline-start: var\(--gap-hang-offset, 0\);/);
  });

  test('the engine imports it and wraps each feedback line in .gap-hang', () => {
    const view = read('InlineTypedGapExercise.tsx');
    expect(view).toContain("import './inline-gap.css';");
    expect(view).toMatch(/<span className="gap-hang">\s*<AnswerFeedback/);
  });
});
