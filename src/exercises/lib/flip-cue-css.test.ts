/**
 * flip-cue-css.test.ts — the retiring corner's exits (TODO §E21). Each exit's CSS
 * duration must equal FLIP_CUE_EXIT_MS, which picks the card that reports the end of
 * the retirement; reduced motion gets one quiet fade, no delay, no sparkles and no shards.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { FLIP_CUE_EXIT_MS, type FlipCueExit } from './flip-cue-exits';

const css = readFileSync(path.join(import.meta.dirname, 'flip-cue.css'), 'utf8');
const EXITS = Object.keys(FLIP_CUE_EXIT_MS) as FlipCueExit[];

/** The text of the `@media (prefers-reduced-motion: reduce)` block. */
const reducedMotion = (() => {
  const start = css.indexOf('@media (prefers-reduced-motion: reduce)');
  return start === -1 ? '' : css.slice(start);
})();

describe('flip-cue.css exits', () => {
  test.each(EXITS)('%s plays its own keyframes for FLIP_CUE_EXIT_MS', (exit) => {
    expect(css).toContain(`@keyframes flip-cue-${exit} {`);
    const rule = new RegExp(
      `\\.flip-cue\\[data-exit='${exit}'\\]\\s*\\{[^}]*animation:\\s*flip-cue-${exit}\\s+${FLIP_CUE_EXIT_MS[exit]}ms`,
    );
    expect(css).toMatch(rule);
  });

  test('every exit waits for its own delay and holds its last frame', () => {
    for (const exit of EXITS) {
      const rule = new RegExp(
        `\\.flip-cue\\[data-exit='${exit}'\\]\\s*\\{[^}]*var\\(--flip-cue-delay, 0ms\\) both;`,
      );
      expect(css, exit).toMatch(rule);
    }
  });

  test("the shatter's two shards fly for as long as the shatter runs", () => {
    expect(css).toMatch(
      new RegExp(
        `\\.flip-cue-shard\\s*\\{[^}]*${FLIP_CUE_EXIT_MS.shatter}ms[^}]*var\\(--flip-cue-delay, 0ms\\) both;`,
      ),
    );
    expect(css).toContain('@keyframes flip-cue-shard-a {');
    expect(css).toContain('@keyframes flip-cue-shard-b {');
  });

  test('the instruction glyph fades out with the corners', () => {
    expect(css).toMatch(/\.flip-cue-glyph-leaving\s*\{[^}]*animation:\s*flip-cue-fade/);
  });
});

describe('flip-cue.css under reduced motion', () => {
  test('every exit is the same plain fade, with no delay', () => {
    expect(reducedMotion).toMatch(
      /\.flip-cue\[data-exit\]\s*\{\s*animation:\s*flip-cue-fade \d+ms ease-out forwards;\s*\}/,
    );
  });

  test('the pointer does not wave and neither sparkles nor shards show', () => {
    expect(reducedMotion).toMatch(/\.flip-cue\[data-exit\] svg\s*\{\s*animation:\s*none;/);
    expect(reducedMotion).toMatch(/\.flip-cue-sparks,\s*\.flip-cue-shards\s*\{\s*display:\s*none;/);
  });
});

describe('flip-cue.css discipline', () => {
  test('has no !important and keeps every rule in the components layer', () => {
    expect(css).not.toContain('!important');
    expect(css.trim()).toMatch(/^\/\*[\s\S]*?\*\/\s*@layer components \{[\s\S]*\}$/);
  });
});
