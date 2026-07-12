import { test, expect } from 'vitest';
import {
  LoManifestSchema,
  BlockConfigSchema,
  ExerciseConfigSchema,
  ExerciseOptionsSchema,
} from './lo-schema';

// --- Manifest ---------------------------------------------------------------

// A realistic manifest (meta + both ordered ref lists) parses clean.
test('lo-schema: manifest with meta + ordered refs validates', () => {
  const manifest = {
    title: 'Salutations',
    description: 'Greet and introduce yourself',
    blocks: ['01-grammar', '02-vocabulary'],
    exercises: ['01-select', '02-fill-gaps'],
  };
  const parsed = LoManifestSchema.parse(manifest);
  expect(parsed.blocks).toEqual(['01-grammar', '02-vocabulary']);
  expect(parsed.exercises).toEqual(['01-select', '02-fill-gaps']);
});

// Guard: title is required — a manifest without it fails the build.
test('lo-schema: manifest missing title throws', () => {
  expect(() => LoManifestSchema.parse({ exercises: ['01-select'] })).toThrow();
});

// Lenient envelope: omitted ref lists default to empty (a pure contract, 13a).
test('lo-schema: manifest defaults blocks/exercises to empty arrays', () => {
  const parsed = LoManifestSchema.parse({ title: 'Stub' });
  expect(parsed.blocks).toEqual([]);
  expect(parsed.exercises).toEqual([]);
});

// Guard: a blank ref string is rejected (no nameless part).
test('lo-schema: manifest rejects a blank ref', () => {
  expect(() => LoManifestSchema.parse({ title: 'X', exercises: [''] })).toThrow();
});

// --- Exercise / block envelope ---------------------------------------------

// Minimal valid part: a type + a content object.
test('lo-schema: exercise config with type + content validates', () => {
  const cfg = { type: 'select', content: { prompt: 'Pick one' } };
  expect(() => ExerciseConfigSchema.parse(cfg)).not.toThrow();
});

// Guard: type is required — engine resolution (step 14) has nothing to key on without it.
test('lo-schema: part missing type throws', () => {
  expect(() => ExerciseConfigSchema.parse({ content: {} })).toThrow();
});

// Layer-2 override is reused as-is: a typo key (chekc) is rejected, not stripped.
test('lo-schema: part labels override rejects unknown key (typo chekc)', () => {
  const cfg = { type: 'select', content: {}, labels: { chekc: 'Check' } };
  expect(() => ExerciseConfigSchema.parse(cfg)).toThrow();
});

// Layer-2 override is partial: a valid subset passes.
test('lo-schema: part labels override accepts a valid partial subset', () => {
  const cfg = { type: 'select', content: {}, labels: { showAnswer: 'See answer' } };
  expect(() => ExerciseConfigSchema.parse(cfg)).not.toThrow();
});

// Content is deliberately loose now (spec §19): unknown keys survive, not stripped.
test('lo-schema: content is loose — extra keys are preserved', () => {
  const parsed = ExerciseConfigSchema.parse({
    type: 'drag-fill-gaps', // was 'fill-gaps'
    content: { sentence: 'a __ c', answers: ['b'] },
  });
  expect((parsed.content as { answers: string[] }).answers).toEqual(['b']);
});

// Block envelope mirrors the exercise envelope today.
test('lo-schema: block config with type + content validates', () => {
  const cfg = { type: 'grammar', content: { heading: 'Articles' } };
  expect(() => BlockConfigSchema.parse(cfg)).not.toThrow();
});

// Guard: type must be one of the 12 canonical keys — a stray string is rejected.
test('lo-schema: exercise rejects an unknown type key', () => {
  expect(() => ExerciseConfigSchema.parse({ type: 'fill-gaps', content: {} })).toThrow();
});

// Options block is optional; when present, defaults fill in.
test('lo-schema: options defaults shuffle=false, allowShowAnswers=true', () => {
  const parsed = ExerciseConfigSchema.parse({
    type: 'select',
    content: {},
    options: {},
  });
  expect(parsed.options?.shuffle).toBe(false);
  expect(parsed.options?.allowShowAnswers).toBe(true);
  expect(parsed.options?.sampleSize).toBeUndefined();
});

// Options is per-instance: two exercises of the same type can differ.
test('lo-schema: options carries per-instance shuffle + sampleSize', () => {
  const parsed = ExerciseConfigSchema.parse({
    type: 'select',
    content: {},
    options: { shuffle: true, sampleSize: 5 },
  });
  expect(parsed.options).toEqual({ shuffle: true, sampleSize: 5, allowShowAnswers: true });
});

// Guard: sampleSize must be a positive integer.
test('lo-schema: options rejects non-positive sampleSize', () => {
  expect(() => ExerciseOptionsSchema.parse({ sampleSize: 0 })).toThrow();
});

// Block type stays a free string (grammar/vocabulary are not exercise keys).
test('lo-schema: block type accepts a non-exercise string', () => {
  expect(() => BlockConfigSchema.parse({ type: 'grammar', content: {} })).not.toThrow();
});
