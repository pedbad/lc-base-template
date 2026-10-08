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

  test('below the breakpoint the card stacks image over text, 1rem apart', () => {
    const body = rule('.reading-passage', css);

    expect(body).toContain('display: grid;');
    expect(body).toContain('row-gap: 1rem;');
    expect(body).not.toContain('grid-template-columns');
  });

  // Two equal halves with the outcomes block's gap-6.
  test('from a 55rem exercise width, with an image, text left and image right', () => {
    const body = rule('.reading-passage:has(> .reading-image)', query);

    expect(body).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));');
    expect(body).toContain('column-gap: 1.5rem;');
    expect(body).toContain('align-items: start;');
    expect(rule('.reading-text', query)).toContain('grid-area: 1 / 1;');
    expect(rule('.reading-image', query)).toContain('grid-area: 1 / 2;');
  });

  test('without an image the text keeps the whole card', () => {
    expect(query).not.toMatch(/\.reading-passage\s*\{/);
  });
});
