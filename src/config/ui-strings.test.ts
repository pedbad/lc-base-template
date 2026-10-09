import { test, expect } from 'vitest';
import { uiStrings, UiStringsSchema, UiStringsOverrideSchema, resolveLabel } from './ui-strings';

// Importing uiStrings runs the Layer-1 parse at load — see course.config.test.ts.
test('ui-strings: global map validates and loads at import', () => {
  expect(uiStrings.check).toBe('Check');
  expect(Object.values(uiStrings).every((v) => v.length > 0)).toBe(true);
});

// Guard: Layer 1 requires EVERY key — a missing key fails the build.
test('ui-strings: missing required key throws (no half-translated chrome)', () => {
  const incomplete = { check: 'Check' };
  expect(() => UiStringsSchema.parse(incomplete)).toThrow();
});

// Guard: a typo key is rejected, not silently stripped (strict survives partial).
test('ui-strings: override rejects unknown key (typo chekc)', () => {
  expect(() => UiStringsOverrideSchema.parse({ chekc: 'Check' })).toThrow();
});

// Layer 2 is partial: a valid subset passes.
test('ui-strings: override accepts a valid partial subset', () => {
  expect(() => UiStringsOverrideSchema.parse({ showAnswer: 'See answer' })).not.toThrow();
});

// Resolution: override wins; otherwise global default.
test('ui-strings: resolveLabel — override wins, else global fallback', () => {
  expect(resolveLabel('showAnswer', { showAnswer: 'See answer' })).toBe('See answer');
  expect(resolveLabel('showAnswer')).toBe('Show answer');
  expect(resolveLabel('check', {})).toBe('Check');
});

// The media transcript toggle's two labels (tabs spec 2a §4).
test('ui-strings: transcript toggle labels exist', () => {
  expect(resolveLabel('showTranscript')).toBe('Show transcript');
  expect(resolveLabel('hideTranscript')).toBe('Hide transcript');
});

// The progress line (ProgressMeter, 2026-10-09) is a template: a rewording that drops
// a placeholder would show a count with no number, so both are required.
test('progressCorrect: the default names both counts', () => {
  expect(uiStrings.progressCorrect).toContain('{correct}');
  expect(uiStrings.progressCorrect).toContain('{total}');
});

test('progressCorrect: an override missing a placeholder is rejected', () => {
  expect(UiStringsOverrideSchema.safeParse({ progressCorrect: '{correct} right' }).success).toBe(
    false,
  );
  expect(
    UiStringsOverrideSchema.safeParse({ progressCorrect: '{correct} de {total}' }).success,
  ).toBe(true);
});
