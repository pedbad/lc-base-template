import { test, expect } from 'vitest';
import {
  LoManifestSchema,
  LoSectionSchema,
  BlockConfigSchema,
  ExerciseConfigSchema,
  LoExerciseConfigSchema,
  ExerciseOptionsSchema,
} from './lo-schema';

/** A minimal valid manifest, spread into the cases below. */
const oneSection = [{ id: 'grammar', label: 'Grammar', blocks: ['01-grammar'] }];

// --- Manifest ---------------------------------------------------------------

// A realistic manifest (meta + ordered sections carrying their own refs) parses.
test('lo-schema: manifest with meta + ordered sections validates', () => {
  const manifest = {
    title: 'Salutations',
    description: 'Greet and introduce yourself',
    sections: [
      { id: 'introduction', label: 'Introduction', blocks: ['00-intro'] },
      {
        id: 'grammar',
        label: 'Grammar: formal and informal address',
        navLabel: 'Grammar',
        blocks: ['01-grammar'],
      },
      { id: 'exercises', label: 'Exercises', exercises: ['01-select', '02-radio-quiz'] },
    ],
  };
  const parsed = LoManifestSchema.parse(manifest);
  // Section ORDER is the array order — never object key insertion order (§2 D1).
  expect(parsed.sections.map((section) => section.id)).toEqual([
    'introduction',
    'grammar',
    'exercises',
  ]);
  expect(parsed.sections[2].exercises).toEqual(['01-select', '02-radio-quiz']);
});

// Guard: title is required — a manifest without it fails the build.
test('lo-schema: manifest missing title throws', () => {
  expect(() => LoManifestSchema.parse({ sections: oneSection })).toThrow();
});

// Guard: an LO with no sections has no page to render (§2 D2 — no hardcoded ones).
test('lo-schema: manifest with no sections throws', () => {
  expect(() => LoManifestSchema.parse({ title: 'X', sections: [] })).toThrow();
  expect(() => LoManifestSchema.parse({ title: 'X' })).toThrow();
});

// Guard: duplicate section ids would collide as anchors AND heading ids.
test('lo-schema: manifest rejects duplicate section ids', () => {
  const manifest = {
    title: 'X',
    sections: [
      { id: 'grammar', label: 'Grammar', blocks: ['01-grammar'] },
      { id: 'grammar', label: 'More grammar', blocks: ['02-grammar'] },
    ],
  };
  expect(() => LoManifestSchema.parse(manifest)).toThrow(/grammar/);
});

// Guard: a blank ref string is rejected (no nameless part).
test('lo-schema: manifest rejects a blank ref', () => {
  const manifest = { title: 'X', sections: [{ id: 'ex', label: 'Ex', exercises: [''] }] };
  expect(() => LoManifestSchema.parse(manifest)).toThrow();
});

// --- Section ----------------------------------------------------------------

// Both ref lists are optional; a section may carry blocks, exercises, or both.
test('lo-schema: section defaults its unused ref list to empty', () => {
  const parsed = LoSectionSchema.parse({ id: 'grammar', label: 'Grammar', blocks: ['01-a'] });
  expect(parsed.blocks).toEqual(['01-a']);
  expect(parsed.exercises).toEqual([]);
});

// Guard (§2 D2): a nav entry exists because CONTENT exists. An empty section would
// emit a nav link to nothing, so it is rejected outright.
test('lo-schema: section with no blocks and no exercises throws', () => {
  expect(() => LoSectionSchema.parse({ id: 'empty', label: 'Empty' })).toThrow();
});

// Guard (§2 D3): `label` is the <h2> and the default nav text — never derived.
test('lo-schema: section missing or blank label throws', () => {
  expect(() => LoSectionSchema.parse({ id: 'grammar', blocks: ['01-a'] })).toThrow();
  expect(() => LoSectionSchema.parse({ id: 'grammar', label: '', blocks: ['01-a'] })).toThrow();
});

// `navLabel` is the optional shorter nav override; absent is the common case.
test('lo-schema: section navLabel is optional', () => {
  expect(
    LoSectionSchema.parse({ id: 'g', label: 'Grammar', blocks: ['01-a'] }).navLabel,
  ).toBeUndefined();
  expect(
    LoSectionSchema.parse({
      id: 'g',
      label: 'Grammar: address',
      navLabel: 'Grammar',
      blocks: ['01-a'],
    }).navLabel,
  ).toBe('Grammar');
});

// `id` becomes an `#anchor` and feeds headingId() — keep it URL-safe kebab-case.
test('lo-schema: section id must be url-safe kebab-case', () => {
  expect(() =>
    LoSectionSchema.parse({ id: 'Going To A Café', label: 'X', blocks: ['a'] }),
  ).toThrow();
  expect(() =>
    LoSectionSchema.parse({ id: 'going-to-a-cafe', label: 'X', blocks: ['a'] }),
  ).not.toThrow();
});

// --- Exercise / block envelope ---------------------------------------------

// Minimal valid part: a type + a content object.
test('lo-schema: exercise config with type + content validates', () => {
  const cfg = { type: 'select', content: { prompt: 'Pick one' } };
  expect(() => ExerciseConfigSchema.parse(cfg)).not.toThrow();
});

// The accordion <h3> is human text with no derivable source (§2 D3's argument
// applies to accordions too), so an LO-referenced exercise MUST carry a title.
// The showcase supplies its card title out-of-band, so the shared envelope keeps
// `title` optional and only the LO-facing schema requires it.
test('lo-schema: LO exercise config requires a title, shared envelope does not', () => {
  const untitled = { type: 'select', content: {} };
  expect(() => ExerciseConfigSchema.parse(untitled)).not.toThrow();
  expect(() => LoExerciseConfigSchema.parse(untitled)).toThrow();
  expect(LoExerciseConfigSchema.parse({ ...untitled, title: 'Ser or estar' }).title).toBe(
    'Ser or estar',
  );
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

// Block envelope mirrors the exercise envelope, plus a required accordion title
// (blocks exist only inside an LO, so there is no titleless consumer to spare).
test('lo-schema: block config with title + type + content validates', () => {
  const cfg = { type: 'grammar', title: 'Articles', content: { heading: 'Articles' } };
  expect(() => BlockConfigSchema.parse(cfg)).not.toThrow();
});

// Guard: a block without a title has no <h3> for its accordion.
test('lo-schema: block config missing title throws', () => {
  expect(() => BlockConfigSchema.parse({ type: 'grammar', content: {} })).toThrow();
});

// Accordions start closed; a block may opt in to opening (an introduction the
// learner shouldn't have to unfold to read).
test('lo-schema: block defaultOpen defaults to false and accepts true', () => {
  const base = { type: 'prose', title: 'Intro', content: {} };
  expect(BlockConfigSchema.parse(base).defaultOpen).toBe(false);
  expect(BlockConfigSchema.parse({ ...base, defaultOpen: true }).defaultOpen).toBe(true);
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
  expect(() => BlockConfigSchema.parse({ type: 'grammar', title: 'X', content: {} })).not.toThrow();
});
