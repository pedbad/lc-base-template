/**
 * load-lo.test.ts — the two readers, against the real `lo-00-example` on disk.
 *
 * The point of the second assertion set is Part D: the pre-render runs in plain Node,
 * so "the same LO loads from Node" has to be TESTED, not assumed. Both readers feed
 * the same assembler, so their output must be identical.
 */
import { test, expect } from 'vitest';
import { loadLo as loadLoFromGlob, listLoSlugs as globSlugs } from './load-lo-glob';
import { loadLo as loadLoFromDisk, listLoSlugs as diskSlugs } from './load-lo-disk';

const EXAMPLE = 'lo-00-example';

test('loadLo (glob): loads the example LO with its sections in order', () => {
  const lo = loadLoFromGlob(EXAMPLE);

  expect(lo.slug).toBe(EXAMPLE);
  expect(lo.title).toBe('Example Learning Object');
  expect(lo.sections.map((section) => section.id)).toEqual([
    'introduction',
    'grammar',
    'vocabulary',
    'exercises',
  ]);
  // The exercises section holds both exercises, in manifest order.
  expect(lo.sections[3].exercises.map((exercise) => exercise.ref)).toEqual([
    '01-select',
    '02-radio-quiz',
  ]);
  // Parts are resolved, not left as refs.
  expect(lo.sections[0].blocks[0].config.type).toBe('intro');
  // The intro is the example's PLAIN block — no accordion, so no defaultOpen. It
  // used to be this assertion's `defaultOpen: true` case.
  expect(lo.sections[0].blocks[0].config.presentation).toBe('plain');
});

test('loadLo (disk): produces exactly the same LO as the glob reader', () => {
  expect(loadLoFromDisk(EXAMPLE)).toEqual(loadLoFromGlob(EXAMPLE));
});

test('listLoSlugs: both readers discover the example LO', () => {
  expect(globSlugs()).toContain(EXAMPLE);
  expect(diskSlugs()).toContain(EXAMPLE);
});

test('loadLo: an unknown slug fails naming the file it looked for', () => {
  expect(() => loadLoFromGlob('lo-99-nope')).toThrow(/lo-config\/lo-99-nope\/lo\.json/);
  expect(() => loadLoFromDisk('lo-99-nope')).toThrow(/lo-config\/lo-99-nope\/lo\.json/);
});
