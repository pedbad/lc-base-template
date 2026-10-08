/**
 * phrase-reorder-css.test.ts — a prompted row on a narrow exercise (TODO §D13,
 * 2026-10-08). At 320px the row's three columns (speaker | prompt | phrase) left each
 * phrase button 78px wide and "¿Cómo estás?" ran out of it. While the exercise is
 * narrower than 30rem the phrase sits under its prompt; from 30rem the three columns
 * return. A container query, not a viewport one (as reading.css).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const css = readFileSync(path.join(import.meta.dirname, 'phrase-reorder.css'), 'utf8');
const rule = (selector: string, source: string): string => {
  const escaped = selector.replace(/[.:()>[\]=']/g, (char) => `\\${char}`);
  return new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(source)?.[1] ?? '';
};
const wide =
  /@container phrase-reorder \(width >= 30rem\)\s*\{([\s\S]*?)\n {2}\}/.exec(css)?.[1] ?? '';
/** The sheet outside the container query: what a narrow exercise gets. */
const narrow = css.replace(/@container[\s\S]*?\n {2}\}/, '');
const PROMPTED = ".phrase-reorder-row[data-has-prompt='true']";

describe('phrase-reorder.css', () => {
  test('the engine root is a named inline-size container', () => {
    expect(rule('.phrase-reorder', css)).toContain('container: phrase-reorder / inline-size;');
  });

  test('narrow: a prompted row keeps two columns, the phrase under its prompt', () => {
    expect(narrow).toContain('.phrase-reorder-row {');
    expect(rule(PROMPTED, narrow)).not.toContain('grid-template-columns');
    expect(rule(`${PROMPTED} .phrase-reorder-audio`, narrow)).toContain('grid-row: span 2;');
    expect(rule(`${PROMPTED} .phrase-reorder-token`, narrow)).toContain('grid-column: 2;');
  });

  test('from 30rem: speaker | prompt | phrase on one line', () => {
    expect(rule(PROMPTED, wide)).toContain(
      'grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr);',
    );
    expect(rule(`${PROMPTED} .phrase-reorder-audio`, wide)).toContain('grid-row: auto;');
    expect(rule(`${PROMPTED} .phrase-reorder-token`, wide)).toContain('grid-column: auto;');
  });
});
