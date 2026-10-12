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

  // Maintainer, 2026-10-12: the faces sat off the rings' line (drawn bigger than their
  // box), and the circles were larger than the other exercises'. Each face is now
  // centred on its slot, and a slot is the meter's 1.5rem icon size with its 2px ring.
  test('a slot is 1.5rem with a 2px muted ring, like the progress meter', () => {
    const body = rule('.flashcards-dot');
    expect(body).toMatch(/width:\s*1\.5rem/);
    expect(body).toMatch(/height:\s*1\.5rem/);
    expect(body).toMatch(/border:\s*2px solid var\(--muted-foreground\)/);
    expect(body).toMatch(/position:\s*relative/);
  });

  test('the face is centred on its slot and spans the ring’s diameter', () => {
    const body = rule('.flashcards-dot:where([data-result]) svg');
    expect(body).toMatch(/position:\s*absolute/);
    expect(body).toMatch(/translate:\s*-50% -50%/);
    expect(body).toMatch(/width:\s*calc\(1\.5rem \* 24 \/ 22\)/);
  });

  test('a complete deck hops, one circle after another, only without reduced motion', () => {
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*\.flashcards-dots\[data-complete\] \.flashcards-dot\s*\{[^}]*animation:[^}]*--slot-index/,
    );
    expect(css).toMatch(/@keyframes flashcards-hop/);
  });
});
