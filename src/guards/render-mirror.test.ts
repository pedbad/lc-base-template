/**
 * render-mirror.test.ts — guard b (buildlist 20).
 *
 * Each `it` that names a violation is a DELIBERATELY BROKEN sample proved to be
 * caught; the sweep at the bottom then asserts the real repo is clean. A guard whose
 * failure nobody has watched may simply be asleep.
 */
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CONFIG_FILE_BY_KIND,
  PART_KINDS,
  findMalformedLoFolders,
  findMirrorViolations,
  presentParts,
  readLoStructures,
  referencedRefs,
} from './render-mirror';
import type { LoStructure } from './render-mirror';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const EXAMPLE_DIR = path.join(REPO_ROOT, 'lo-config/lo-00-example');

/** A structure with nothing in it, to be spread over with just the case under test. */
const emptyStructure = (folder = 'lo-00-example'): LoStructure => ({
  folder,
  referenced: { blocks: [], exercises: [], modals: [] },
  present: { blocks: [], exercises: [], modals: [] },
});

describe('referencedRefs — what the manifest names', () => {
  it('collects block and exercise refs across sections, plus modals', () => {
    const manifest = {
      sections: [
        { id: 'a', blocks: ['00-intro'], exercises: [] },
        { id: 'b', blocks: ['01-grammar'], exercises: ['01-select', '02-radio-quiz'] },
      ],
      modals: ['example-popup'],
    };
    expect(referencedRefs(manifest)).toEqual({
      blocks: ['00-intro', '01-grammar'],
      exercises: ['01-select', '02-radio-quiz'],
      modals: ['example-popup'],
    });
  });

  it('treats absent keys as nothing referenced, not as a crash', () => {
    expect(referencedRefs({ sections: [{ id: 'a' }] })).toEqual({
      blocks: [],
      exercises: [],
      modals: [],
    });
    expect(referencedRefs({})).toEqual({ blocks: [], exercises: [], modals: [] });
  });

  // A malformed manifest is guard a's failure to report, not this one's. Guard b
  // still has to say what it can see, so it reads the JSON defensively.
  it('survives a manifest of the wrong shape entirely', () => {
    expect(referencedRefs(null)).toEqual({ blocks: [], exercises: [], modals: [] });
    expect(referencedRefs({ sections: 'nope', modals: [42, '', 'ok'] })).toEqual({
      blocks: [],
      exercises: [],
      modals: ['ok'],
    });
  });
});

describe('presentParts — what is on disk', () => {
  it('reads the example LO’s folders, each with its config file', () => {
    const present = presentParts(EXAMPLE_DIR);
    expect(present.blocks.map((part) => part.ref)).toEqual([
      '00-intro',
      '01-grammar',
      '02-vocabulary',
      '03-outcomes',
    ]);
    expect(present.exercises.map((part) => part.ref)).toEqual(['01-select', '02-radio-quiz']);
    expect(present.modals.map((part) => part.ref)).toEqual(['example-popup']);
    expect(present.blocks.every((part) => part.hasConfig)).toBe(true);
  });

  it('reports an absent kind folder as nothing present — an LO may have no exercises', () => {
    expect(presentParts(path.join(EXAMPLE_DIR, 'no-such-lo'))).toEqual({
      blocks: [],
      exercises: [],
      modals: [],
    });
  });
});

describe('findMirrorViolations — catches drift in either direction', () => {
  it('flags a ref the manifest names with no folder behind it', () => {
    const found = findMirrorViolations({
      ...emptyStructure(),
      referenced: { blocks: ['01-grammar'], exercises: [], modals: [] },
    });
    expect(found).toHaveLength(1);
    expect(found[0]?.problem).toBe('missing');
    expect(found[0]?.ref).toBe('01-grammar');
    expect(found[0]?.file).toBe('lo-config/lo-00-example/blocks/01-grammar/block.json');
  });

  it('flags a folder the manifest never names — the silent one', () => {
    const found = findMirrorViolations({
      ...emptyStructure(),
      present: { blocks: [], exercises: [{ ref: '03-flashcards', hasConfig: true }], modals: [] },
    });
    expect(found).toHaveLength(1);
    expect(found[0]?.problem).toBe('unreferenced');
    expect(found[0]?.ref).toBe('03-flashcards');
    expect(found[0]?.file).toBe('lo-config/lo-00-example/exercises/03-flashcards/exercise.json');
  });

  // The folder is there and the ref resolves to it, so a set diff alone sees nothing
  // wrong — but with no `exercise.json` the loader skips it and the page renders
  // without it. Same silence, so the same guard has to speak.
  it('flags a referenced folder that holds no config file', () => {
    const found = findMirrorViolations({
      ...emptyStructure(),
      referenced: { blocks: [], exercises: ['01-select'], modals: [] },
      present: { blocks: [], exercises: [{ ref: '01-select', hasConfig: false }], modals: [] },
    });
    expect(found).toHaveLength(1);
    expect(found[0]?.problem).toBe('missing');
    expect(found[0]?.file).toBe('lo-config/lo-00-example/exercises/01-select/exercise.json');
  });

  it('flags a declared modal with no folder, and an undeclared modal folder', () => {
    const found = findMirrorViolations({
      ...emptyStructure(),
      referenced: { blocks: [], exercises: [], modals: ['declared'] },
      present: { blocks: [], exercises: [], modals: [{ ref: 'orphan', hasConfig: true }] },
    });
    expect(found.map((v) => [v.problem, v.ref])).toEqual([
      ['missing', 'declared'],
      ['unreferenced', 'orphan'],
    ]);
    expect(found.every((v) => v.kind === 'modals')).toBe(true);
  });

  it('reports both directions and every kind at once, never just the first', () => {
    const found = findMirrorViolations({
      folder: 'lo-01-salutations',
      referenced: { blocks: ['ghost-block'], exercises: ['ghost-ex'], modals: [] },
      present: {
        blocks: [{ ref: 'orphan-block', hasConfig: true }],
        exercises: [{ ref: 'orphan-ex', hasConfig: true }],
        modals: [{ ref: 'orphan-modal', hasConfig: true }],
      },
    });
    expect(found).toHaveLength(5);
    expect(found.every((v) => v.folder === 'lo-01-salutations')).toBe(true);
  });

  it('passes a structure whose two halves agree', () => {
    expect(
      findMirrorViolations({
        ...emptyStructure(),
        referenced: { blocks: ['00-intro'], exercises: [], modals: ['popup'] },
        present: {
          blocks: [{ ref: '00-intro', hasConfig: true }],
          exercises: [],
          modals: [{ ref: 'popup', hasConfig: true }],
        },
      }),
    ).toEqual([]);
  });
});

describe('findMalformedLoFolders — the naming half', () => {
  it('passes a well-formed folder name', () => {
    expect(findMalformedLoFolders(['lo-00-example', 'lo-01-first-contact'])).toEqual([]);
  });

  it('flags a name with no `lo-NN-` ordinal, which is the only source of course order', () => {
    const found = findMalformedLoFolders(['example', 'lo-first-contact', 'lo-02-']);
    expect(found.map((entry) => entry.folder)).toEqual(['example', 'lo-first-contact', 'lo-02-']);
    expect(found[0]?.reason).toMatch(/lo-<ordinal>-/);
  });

  it('flags a slug that is not url-safe lowercase kebab-case', () => {
    expect(findMalformedLoFolders(['lo-03-First_Contact'])).toHaveLength(1);
    expect(findMalformedLoFolders(['lo-03-café'])).toHaveLength(1);
  });
});

describe('the repo itself obeys guard b', () => {
  const structures = readLoStructures();

  // If the manifest is reshaped — `sections` renamed, `blocks[]` restructured — the
  // collector would find nothing and this guard would pass by doing nothing at all.
  // These floors make a reshape fail loudly instead of switching the guard off.
  it('found LOs, sections’ refs and folders to compare (the readers have not gone stale)', () => {
    expect(PART_KINDS.length).toBe(3);
    expect(structures.length).toBeGreaterThan(0);
    for (const kind of PART_KINDS) {
      expect(
        structures.flatMap((lo) => lo.referenced[kind]).length,
        `no ${kind} refs found in any manifest — has lo.json been reshaped?`,
      ).toBeGreaterThan(0);
      expect(
        structures.flatMap((lo) => lo.present[kind]).length,
        `no ${kind} folders found on disk — has ${CONFIG_FILE_BY_KIND[kind]} been renamed?`,
      ).toBeGreaterThan(0);
    }
  });

  it('names every LO folder so its ordinal gives it a place in the course order', () => {
    const malformed = findMalformedLoFolders(structures.map((lo) => lo.folder));
    expect(malformed, malformed.map((entry) => `  ${entry.reason}`).join('\n')).toEqual([]);
  });

  it('has a folder for every ref, and a ref for every folder', () => {
    const violations = structures.flatMap(findMirrorViolations);
    expect(
      violations,
      `manifest and disk disagree:\n${violations
        .map((v) => `  ${v.problem}: ${v.file}`)
        .join('\n')}`,
    ).toEqual([]);
  });
});
