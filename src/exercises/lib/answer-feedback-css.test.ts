/**
 * answer-feedback-css.test.ts — how the revealed answer marks what differs (maintainer,
 * 2026-10-09; TODO §D15). The first colour, the info alert's ground, was a 10% tint in
 * dark and a 3px sliver behind a single narrow letter, so it read as nothing. Now the
 * difference is bold and underlined as well as tinted: it does not rest on colour, and
 * a lone `l` still shows. Lazy CSS: only the typed engines load it, never main-*.css.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const css = readFileSync(path.join(import.meta.dirname, 'answer-feedback.css'), 'utf8');
const rule = /\.answer-diff\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';

describe('answer-feedback.css', () => {
  test('lives in the components layer', () => {
    expect(css).toMatch(/@layer components\s*\{/);
  });

  test('marks the difference by weight and underline, not colour alone', () => {
    expect(rule).toMatch(/font-weight: 700;/);
    expect(rule).toMatch(/text-decoration-line: underline;/);
    expect(rule).toMatch(/text-decoration-thickness: [\d.]+em;/);
    expect(rule).toMatch(/text-decoration-color: var\(--primary\);/);
  });

  test('tints it with an opaque mix over the card, so dark is not a 10% wash', () => {
    expect(rule).toMatch(
      /background-color: color-mix\(in oklab, var\(--primary\) \d+%, var\(--card\)\);/,
    );
    expect(rule).toMatch(/color: var\(--foreground\);/);
  });

  test('AnswerFeedback imports it, so it ships with the engines that use it', () => {
    const view = readFileSync(path.join(import.meta.dirname, 'AnswerFeedback.tsx'), 'utf8');
    expect(view).toContain("import './answer-feedback.css';");
  });
});
