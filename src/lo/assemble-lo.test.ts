/**
 * assemble-lo.test.ts — the pure assembler: manifest + raw part files → one typed,
 * ordered LO. No I/O here (that is the readers' job), so every failure mode is
 * exercised with hand-built trees.
 */
import { test, expect } from 'vitest';
import { assembleLo, type LoFileTree } from './assemble-lo';

/** A valid two-section tree used as the base for the cases below. */
function validTree(): LoFileTree {
  return {
    manifest: {
      title: 'Salutations',
      description: 'Greet people',
      sections: [
        { id: 'grammar', label: 'Grammar rules', navLabel: 'Grammar', blocks: ['01-grammar'] },
        { id: 'exercises', label: 'Exercises', exercises: ['01-select', '02-radio-quiz'] },
      ],
    },
    blocks: {
      '01-grammar': { type: 'grammar', title: 'Ser vs estar', content: { text: 'Yo soy.' } },
    },
    exercises: {
      '01-select': {
        type: 'select',
        title: 'Pick one',
        content: { items: [{ text: 'a [*b|c]' }] },
      },
      '02-radio-quiz': { type: 'radio-quiz', title: 'Quiz', content: { questions: [] } },
    },
  };
}

test('assembleLo: returns sections and their items in declared order', () => {
  const lo = assembleLo('lo-01-salutations', validTree());

  expect(lo.slug).toBe('lo-01-salutations');
  expect(lo.title).toBe('Salutations');
  expect(lo.description).toBe('Greet people');
  expect(lo.sections.map((section) => section.id)).toEqual(['grammar', 'exercises']);
  expect(lo.sections[0].navLabel).toBe('Grammar');
  expect(lo.sections[1].exercises.map((exercise) => exercise.ref)).toEqual([
    '01-select',
    '02-radio-quiz',
  ]);
});

test('assembleLo: carries the manifest card image through to the assembled LO', () => {
  const tree = validTree();
  const lo = assembleLo('lo-01-salutations', {
    ...tree,
    manifest: { ...(tree.manifest as object), image: 'images/salutations.svg' },
  });

  expect(lo.image).toBe('images/salutations.svg');
});

test('assembleLo: omits the image key entirely when the manifest declares none', () => {
  const lo = assembleLo('lo-01-salutations', validTree());

  expect('image' in lo).toBe(false);
});

test('assembleLo: resolves each ref to its parsed config', () => {
  const lo = assembleLo('lo-01-salutations', validTree());

  expect(lo.sections[0].blocks[0].config.title).toBe('Ser vs estar');
  expect(lo.sections[0].blocks[0].config.type).toBe('grammar');
  // Schema defaults are applied, so renderers never re-derive them.
  expect(lo.sections[0].blocks[0].config.defaultOpen).toBe(false);
  expect(lo.sections[1].exercises[0].config.type).toBe('select');
});

test('assembleLo: a section with no exercises gets an empty list, not undefined', () => {
  const lo = assembleLo('lo-01-salutations', validTree());
  expect(lo.sections[0].exercises).toEqual([]);
});

// --- Fail fast and loud, naming the offending file --------------------------

test('assembleLo: a malformed manifest names lo.json', () => {
  const tree = { ...validTree(), manifest: { sections: [] } };
  expect(() => assembleLo('lo-01-salutations', tree)).toThrow(
    /lo-config\/lo-01-salutations\/lo\.json/,
  );
});

test('assembleLo: a missing block file names the path it looked for', () => {
  const tree = { ...validTree(), blocks: {} };
  expect(() => assembleLo('lo-01-salutations', tree)).toThrow(
    /lo-config\/lo-01-salutations\/blocks\/01-grammar\/block\.json/,
  );
});

test('assembleLo: a missing exercise file names the path it looked for', () => {
  const tree = validTree();
  expect(() =>
    assembleLo('lo-01-salutations', {
      ...tree,
      exercises: { '01-select': tree.exercises['01-select'] },
    }),
  ).toThrow(/lo-config\/lo-01-salutations\/exercises\/02-radio-quiz\/exercise\.json/);
});

test('assembleLo: an untitled block names its own file, not the manifest', () => {
  const tree = validTree();
  const error = (() => {
    try {
      assembleLo('lo-01-salutations', {
        ...tree,
        blocks: { '01-grammar': { type: 'grammar', content: {} } },
      });
      return null;
    } catch (thrown) {
      return thrown as Error;
    }
  })();

  expect(error?.message).toMatch(/blocks\/01-grammar\/block\.json/);
  expect(error?.message).toMatch(/title/);
});

test('assembleLo: an unknown exercise type is rejected at load', () => {
  const tree = validTree();
  expect(() =>
    assembleLo('lo-01-salutations', {
      ...tree,
      exercises: {
        ...tree.exercises,
        '01-select': { type: 'fill-gaps', title: 'X', content: {} },
      },
    }),
  ).toThrow(/exercises\/01-select\/exercise\.json/);
});
