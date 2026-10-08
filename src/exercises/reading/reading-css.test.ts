/**
 * reading-css.test.ts — at a wide EXERCISE width the passage card holds its text on
 * the left and its illustration on the right; the questions run full width below. A
 * container query, not a viewport one: an exercise can sit in an accordion card or a
 * tab panel, where the viewport says nothing about its width.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const css = readFileSync(path.join(import.meta.dirname, 'reading.css'), 'utf8');
const rule = (selector: string, source: string): string => {
  const escaped = selector.replace(/[.:()>]/g, (char) => `\\${char}`);
  return new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(source)?.[1] ?? '';
};
const query = /@container reading \(width >= 55rem\)\s*\{([\s\S]*?)\n {2}\}/.exec(css)?.[1] ?? '';

describe('reading.css', () => {
  test('the engine root is a named inline-size container', () => {
    expect(rule('.reading', css)).toContain('container: reading / inline-size;');
  });

  // Edge to edge (maintainer, 2026-10-08): the image meets the card's border and the
  // card's rounded corners clip it; only the text keeps the padding.
  test('below the breakpoint the card stacks image over text and clips its corners', () => {
    const body = rule('.reading-passage', css);

    expect(body).toContain('display: grid;');
    expect(body).toContain('overflow: hidden;');
    expect(body).not.toContain('grid-template-columns');
  });

  // The image column is half the card's OUTER width less the outcomes block's 1.5rem
  // gap — the intro image's exact size (532px on a 1088px LO column). 100% is the
  // content box, so the card's two 1px borders (0.125rem) are added back.
  test('from a 55rem exercise width, with an image, text left and an intro-sized image right', () => {
    const body = rule('.reading-passage:has(> .reading-image)', query);

    expect(body).toContain(
      'grid-template-columns: minmax(0, 1fr) calc((100% + 0.125rem - 1.5rem) / 2);',
    );
    expect(body).toContain('align-items: start;');
    expect(rule('.reading-text', query)).toContain('grid-area: 1 / 1;');
    expect(rule('.reading-image', query)).toContain('grid-area: 1 / 2;');
  });

  test('without an image the text keeps the whole card', () => {
    expect(query).not.toMatch(/\.reading-passage\s*\{/);
  });
});
