/**
 * exercise-buttons.test.tsx — the footer's button looks, rendered through `Button`,
 * and the one local change to the vendored `Button` they rely on (the destructive
 * variant's label colour). That test lives here, not beside `button.tsx`: every file
 * in `src/components/ui/` is read as a wrapper by the `@source not` guard
 * (`src/build/source-negation.test.ts`).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { Button, buttonVariants } from '@/components/ui/button';
import { EXERCISE_BUTTONS } from './exercise-buttons';

const classes = (html: string) => /class="([^"]*)"/.exec(html)?.[1].split(' ') ?? [];

describe('EXERCISE_BUTTONS.reset', () => {
  // The destructive variant writes --destructive (crest red) on its own 10% tint:
  // 3.81:1 light, 2.74:1 dark, under the 4.5:1 text needs (axe, sandbox, 2026-10-07).
  // --destructive-text is the crest pulled toward --foreground: 5.48 / 5.08:1.
  test('writes its label in --destructive-text, not the crest red', () => {
    const list = classes(renderToStaticMarkup(<Button {...EXERCISE_BUTTONS.reset}>Reset</Button>));

    expect(list).toContain('text-destructive-text');
    expect(list).not.toContain('text-destructive');
  });

  test('keeps the destructive tint behind it', () => {
    const list = classes(renderToStaticMarkup(<Button {...EXERCISE_BUTTONS.reset}>Reset</Button>));

    expect(list).toContain('bg-destructive/10');
  });
});

// TODO §D13 (2026-10-08): shadcn's destructive variant lettered its label in the crest
// red, failing 4.5:1 on its own tint (3.81 light / 2.74 dark: the sandbox's plain
// Destructive samples). The variant now uses --destructive-text, so Reset needs no
// override and no other destructive button can fail the same way.
describe('Button, destructive variant', () => {
  const list = buttonVariants({ variant: 'destructive' }).split(' ');

  test('writes its label in --destructive-text, not the crest red', () => {
    expect(list).toContain('text-destructive-text');
    expect(list).not.toContain('text-destructive');
  });

  test('Reset is that variant with no override', () => {
    expect(EXERCISE_BUTTONS.reset).toEqual({ variant: 'destructive' });
  });
});

// TODO §D14 (2026-10-09): Check's hover, `bg-success/90`, faded the green toward the
// card: white on #358962, 4.28:1 (axe, light theme, the pointer resting on Check). The
// hover now pulls --success toward --foreground, away from its own label in both
// themes (dark green under white in light, light green under dark blue in dark).
describe('EXERCISE_BUTTONS.check', () => {
  const list = () =>
    classes(renderToStaticMarkup(<Button {...EXERCISE_BUTTONS.check}>Check</Button>));

  test('hovers to --check-hover, not a fade toward the card', () => {
    expect(list()).toContain('exercise-check');
    expect(list()).toContain('hover:bg-(--check-hover)');
    expect(list().some((c) => /^hover:bg-success\/\d+$/.test(c))).toBe(false);
  });

  // The mix lives in a lazy sheet: as an arbitrary utility its escaped selector cost
  // the main sheet 0.04 kB of its last 0.12 (docs/TOOLING.md).
  test('--check-hover pulls --success toward --foreground, in exercise-buttons.css', () => {
    const css = readFileSync(path.join(import.meta.dirname, 'exercise-buttons.css'), 'utf8');
    expect(css).toMatch(/@layer components\s*\{/);
    expect(css).toMatch(
      /\.exercise-check\s*\{[^}]*--check-hover:\s*color-mix\(in oklch, var\(--success\), var\(--foreground\) 15%\)/,
    );
  });

  test('keeps the variant default hover out', () => {
    expect(list()).not.toContain('hover:bg-primary/80');
  });
});
