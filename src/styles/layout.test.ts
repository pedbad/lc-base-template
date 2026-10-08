/**
 * layout.test.ts — one page frame, one gutter, one reading measure (TODO §D11). A
 * fourth token, the 48rem exercise track, went on 2026-10-08 when the last engines
 * moved to the full column (TODO §D13).
 *
 * THE BUG CLASS. Width was written down per page: `max-w-5xl px-4` on the LO page,
 * `max-w-5xl px-6` on the sandbox, `max-w-3xl px-6` on the showcase. Three columns,
 * two gutters, and one cap (`.doc-prose`'s 68ch) that held code blocks to a text
 * measure, so nine of them scrolled sideways inside a 976px column. These tests pin
 * the layout tokens and the rules that read them, so a page cannot quietly grow
 * its own width again.
 *
 * WHY 60ch AND NOT 68ch. `ch` is the width of "0", which in Open Sans is wider than
 * the average glyph. Measured on the built site (2026-10-06): 68ch gave lesson prose
 * about 83 characters per line; 60ch gives about 74, inside the 60–75 a reading measure
 * is for. Maintainer's decision, with the 72rem frame.
 *
 * Browser behaviour (overflow, line length, edge alignment) cannot be seen from jsdom;
 * it was measured on the built site and the figures are in TODO §D11. These tests hold
 * the contract that produced them.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const SRC = path.resolve(import.meta.dirname, '..');

const read = (relative: string): string => readFileSync(path.join(SRC, relative), 'utf8');

/** The body of the first flat rule whose selector list is exactly `selector`. */
function ruleBody(css: string, selector: string): string | undefined {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(String.raw`(?:^|[\n}])\s*${escaped}\s*\{([^}]*)\}`).exec(css)?.[1];
}

const layout = read('styles/layout.css');

describe('layout tokens', () => {
  test.each([
    ['--frame-width', '72rem'],
    ['--frame-gutter', 'clamp(1rem, 4vw, 2rem)'],
    ['--measure', '60ch'],
  ])('%s is %s', (token, value) => {
    expect(ruleBody(layout, ':root')).toContain(`${token}: ${value};`);
  });

  // The shared base both stylesheets import (`index.css`, `debug.css`) since 2026-10-07.
  test('styles/app.css imports layout.css, after the colour tokens', () => {
    const app = read('styles/app.css');
    const tokens = app.indexOf("@import './tokens.css';");
    const layoutAt = app.indexOf("@import './layout.css';");
    expect(tokens).toBeGreaterThan(-1);
    expect(layoutAt).toBeGreaterThan(tokens);
  });
});

describe('.page-frame — the one column box', () => {
  const frame = ruleBody(layout, '.page-frame') ?? '';

  test('is centred and capped at the frame width', () => {
    expect(frame).toContain('margin-inline: auto;');
    expect(frame).toContain('max-inline-size: var(--frame-width);');
  });

  test('takes its side padding from the gutter token', () => {
    expect(frame).toContain('padding-inline: var(--frame-gutter);');
  });
});

// Every engine spans the column since 2026-10-08 (TODO §D13); a track nobody uses is
// a width nobody checks.
test('there is no exercise track any more', () => {
  expect(layout).not.toContain('exercise-track');
});

describe('sandbox docs: text keeps the measure, wide blocks break out', () => {
  const sandbox = read('sandbox/sandbox.css');

  test('.doc-prose itself is no longer capped, so <pre> and tables get the column', () => {
    expect(ruleBody(sandbox, '.doc-prose')).not.toMatch(/max-width|max-inline-size/);
  });

  test('its text children are held to the reading measure', () => {
    const selector = [
      '.doc-prose > p',
      '.doc-prose > ul',
      '.doc-prose > ol',
      '.doc-prose > blockquote',
      '.doc-prose > h4',
      '.doc-prose > h5',
      '.doc-prose > h6',
    ].join(',\n  ');
    expect(ruleBody(sandbox, selector)).toContain('max-inline-size: var(--measure);');
  });
});

describe('authored rich text holds the measure', () => {
  const richText = read('lo/rich-text/rich-text.css');

  test('paragraphs and lists are capped; tables and the player are not', () => {
    expect(ruleBody(richText, '.rich-text-paragraph,\n  .rich-text-list')).toContain(
      'max-inline-size: var(--measure);',
    );
  });
});

describe('one measure, not two', () => {
  // Tailwind's `max-w-prose` is 65ch: a second reading measure beside --measure, and
  // the sandbox's intros used it while its docs used 68ch. Name the token instead.
  test('no TSX under src/ reaches for max-w-prose', () => {
    const offenders = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('.tsx') && !file.includes('.test.'))
      .filter((file) => read(file).includes('max-w-prose'));
    expect(offenders).toEqual([]);
  });
});

describe('the intro block spans the column', () => {
  test('.rich-text-full lifts the measure off its paragraphs and lists', () => {
    const richText = read('lo/rich-text/rich-text.css');
    expect(
      ruleBody(
        richText,
        '.rich-text-full .rich-text-paragraph,\n  .rich-text-full .rich-text-list',
      ),
    ).toContain('max-inline-size: none;');
  });
});
