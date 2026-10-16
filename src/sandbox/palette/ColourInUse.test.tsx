/**
 * ColourInUse.test.tsx — ③ of the brand board (§E19): every semantic group and strip
 * drawn as the UI it paints, with its tokens and live contrast one fold away.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SEMANTIC_SWATCHES, SWATCH_STRIPS } from '../sandbox-catalog';
import { ColourInUse } from './ColourInUse';

const html = renderToStaticMarkup(<ColourInUse live={null} />);
const groups = [...SEMANTIC_SWATCHES, ...SWATCH_STRIPS];

describe('ColourInUse', () => {
  it('has one titled panel per semantic group and strip', () => {
    for (const group of groups) {
      expect(html).toMatch(new RegExp(`<h4[^>]*>${group.title}</h4>`));
    }
    expect(html.match(/data-slot="in-use-specimen"/g)).toHaveLength(groups.length);
  });

  it('keeps every token a designer needs in a fold', () => {
    const named = [
      ...SEMANTIC_SWATCHES.flatMap((g) => g.pairs.flatMap((p) => [p.token, p.on])),
      ...SWATCH_STRIPS.flatMap((g) => g.tokens),
    ];
    const folds = [...html.matchAll(/<details[^>]*>.*?<\/details>/gs)].map((m) => m[0]).join('');
    expect(named.filter((token) => !folds.includes(`<code>${token}</code>`))).toEqual([]);
  });

  it('shows a dash for every pair before the colours are read', () => {
    const pairs = SEMANTIC_SWATCHES.flatMap((g) => g.pairs).length;
    expect(html.match(/Contrast with its text: —/g)).toHaveLength(pairs);
  });

  // Decorative samples, like the preset picker's: nothing inside may take focus.
  it('hides each specimen from screen readers, with nothing focusable inside', () => {
    const specimens = [...html.matchAll(/<div[^>]*data-slot="in-use-specimen"[^>]*>/g)];
    expect(specimens.every((m) => m[0].includes('aria-hidden="true"'))).toBe(true);
    // The folds' <summary> is the only interactive element the panels hold.
    expect(html).not.toMatch(/<button|<a |<input|tabindex/);
  });
});
