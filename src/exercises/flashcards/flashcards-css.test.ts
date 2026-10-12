/**
 * flashcards-css.test.ts — the progress circles (maintainer, 2026-10-12). A rated card
 * shows its face alone: lucide's Smile and Frown are circles already, so a ring and
 * tint around them drew a second circle. The face takes the ring's full diameter and a
 * stroke close to the ring's, so rated and unrated circles read as one row.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const css = readFileSync(path.join(import.meta.dirname, 'flashcards.css'), 'utf8');
const rule = (selector: string) =>
  new RegExp(`${selector.replace(/[[\]'.=():]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';

describe('flashcards.css progress circles', () => {
  test('a rated circle drops its ring and tint, keeping only its colour', () => {
    for (const result of ['good', 'again']) {
      const body = rule(`.flashcards-dot[data-result='${result}']`);
      expect(body, result).toMatch(/border-color:\s*transparent/);
      expect(body, result).not.toContain('background');
      expect(body, result).toMatch(/color:/);
    }
  });

  test('the face fills the ring’s diameter, with a stroke near the ring’s', () => {
    const body = rule('.flashcards-dot:where([data-result]) svg');
    expect(body).toMatch(/stroke-width:\s*1\.25/);
    expect(body).toMatch(/width:\s*calc\(/);
  });
});
