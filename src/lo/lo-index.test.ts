/**
 * lo-index.test.ts — the course index: LO folders → ordered card data. Pure, so the
 * reader is a stub here; the real readers (`load-lo-disk`, `load-lo-glob`) are what
 * differ between Node and the browser, not this.
 */
import { describe, expect, it } from 'vitest';
import type { AssembledLo } from './assemble-lo';
import { buildLoIndex } from './lo-index';

/** A stub reader: one assembled LO per folder, titled after the folder. */
function reader(overrides: Record<string, Partial<AssembledLo>> = {}) {
  return (folder: string): AssembledLo => ({
    slug: folder,
    title: `Title of ${folder}`,
    sections: [{ id: 'introduction', label: 'Introduction', blocks: [], exercises: [] }],
    modals: {},
    ...overrides[folder],
  });
}

describe('buildLoIndex', () => {
  it('returns one entry per LO folder, with its slug and manifest copy', () => {
    const index = buildLoIndex(
      ['lo-00-example'],
      reader({ 'lo-00-example': { description: 'A blurb', image: 'images/example.svg' } }),
    );

    expect(index).toEqual([
      {
        folder: 'lo-00-example',
        slug: 'example',
        title: 'Title of lo-00-example',
        description: 'A blurb',
        image: 'images/example.svg',
      },
    ]);
  });

  it('orders entries by folder ordinal, not by the order it was handed', () => {
    const index = buildLoIndex(['lo-02-third', 'lo-00-first', 'lo-01-second'], reader());

    expect(index.map((entry) => entry.slug)).toEqual(['first', 'second', 'third']);
  });

  it('orders numerically, so a tenth LO follows the ninth', () => {
    const index = buildLoIndex(['lo-10-tenth', 'lo-9-ninth'], reader());

    expect(index.map((entry) => entry.slug)).toEqual(['ninth', 'tenth']);
  });

  it('omits description and image keys for an LO that declares neither', () => {
    const [entry] = buildLoIndex(['lo-00-example'], reader());

    expect('description' in entry).toBe(false);
    expect('image' in entry).toBe(false);
  });

  it('is empty for a course with no LO folders', () => {
    expect(buildLoIndex([], reader())).toEqual([]);
  });

  // The collision check lives in loSlugsByFolder; this proves the index goes through
  // it rather than round-tripping folders into pages that overwrite each other.
  it('rejects two folders that derive the same slug, naming both', () => {
    expect(() => buildLoIndex(['lo-00-example', 'lo-01-example'], reader())).toThrow(
      /lo-00-example.*lo-01-example/s,
    );
  });

  it('propagates a malformed folder name', () => {
    expect(() => buildLoIndex(['stray'], reader())).toThrow(/stray/);
  });

  // Fail fast and loud: a broken LO must not be silently dropped from the landing
  // page, because a missing card is invisible where a failed build is not.
  it('propagates the reader’s error for a malformed LO', () => {
    const failing = () => {
      throw new Error('lo-config/lo-00-example/lo.json is invalid');
    };

    expect(() => buildLoIndex(['lo-00-example'], failing)).toThrow(/lo-00-example\/lo\.json/);
  });
});
