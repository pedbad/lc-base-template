/**
 * reading-css.test.ts — the passage sits beside the questions at a wide EXERCISE width
 * (TODO §D13, option 2a). A container query, not a viewport one: an exercise can sit in
 * an accordion card or a tab panel, where the viewport says nothing about its width.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const css = readFileSync(path.join(import.meta.dirname, 'reading.css'), 'utf8');
const rule = (selector: string, source: string): string =>
  new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`).exec(source)?.[1] ?? '';
const query = /@container reading \(width >= 55rem\)\s*\{([\s\S]*?)\n {2}\}/.exec(css)?.[1] ?? '';

describe('reading.css', () => {
  test('the engine root is a named inline-size container', () => {
    expect(rule('.reading', css)).toContain('container: reading / inline-size;');
  });

  test('below the breakpoint passage and questions stack 1rem apart, as before', () => {
    const body = rule('.reading-body', css);

    expect(body).toContain('display: grid;');
    expect(body).toContain('row-gap: 1rem;');
    expect(body).not.toContain('grid-template-columns');
  });

  // 29rem: the widest pill row in the showcase ("Son las dos de la tarde" + two more,
  // 367px) plus the card's padding, gap and verdict slot (82px) is 449px; at exactly
  // 28rem those pills wrapped inside themselves.
  test('from a 55rem exercise width the passage sits left of the questions, top-aligned', () => {
    const body = rule('.reading-body', query);

    expect(body).toContain('grid-template-columns: minmax(0, 1fr) minmax(29rem, 1fr);');
    expect(body).toContain('align-items: start;');
  });
});
