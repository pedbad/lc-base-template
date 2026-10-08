/**
 * rich-text-table-css.test.ts — table cells centre vertically, so a row's text lines
 * up with the speaker in its Listen cell (maintainer, 2026-10-08: after the speakers
 * were enlarged, top-aligned cells left the text 29px above the speaker's centre).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';

const css = readFileSync(path.join(import.meta.dirname, 'rich-text.css'), 'utf8');

test('rich-text table cells align to the middle', () => {
  const cell = /\.rich-text-table th,\s*\.rich-text-table td\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';

  expect(cell).toContain('vertical-align: middle;');
});
