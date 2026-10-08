/**
 * exercise-buttons.test.tsx — the footer's button looks, rendered through `Button`,
 * and the one local change to the vendored `Button` they rely on (the destructive
 * variant's label colour). That test lives here, not beside `button.tsx`: every file
 * in `src/components/ui/` is read as a wrapper by the `@source not` guard
 * (`src/build/source-negation.test.ts`).
 */
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
