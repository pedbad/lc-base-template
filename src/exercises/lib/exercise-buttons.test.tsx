/**
 * exercise-buttons.test.tsx — the footer's button looks, rendered through `Button`.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

import { Button } from '@/components/ui/button';
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
