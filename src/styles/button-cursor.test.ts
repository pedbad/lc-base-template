/**
 * button-cursor.test.ts — every enabled button shows the hand cursor (maintainer,
 * 2026-10-08, spotted in the debug sandbox's Buttons section). Tailwind v4's preflight
 * resets `button` to `cursor: default`, so shadcn's `Button`, the speaker buttons and
 * every bare <button> lost the pointer. One base rule restores it for all of them,
 * including role="button" elements; disabled controls keep the default arrow.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const css = readFileSync(path.join(import.meta.dirname, 'app.css'), 'utf8');
const base = /@layer base\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';

describe('button cursor', () => {
  test('enabled buttons and role="button" elements get the pointer, in the base layer', () => {
    expect(base).toMatch(
      /button:not\(:disabled\),\s*\[role='button'\]:not\(\[aria-disabled='true'\]\)\s*\{\s*cursor: pointer;\s*\}/,
    );
  });
});
