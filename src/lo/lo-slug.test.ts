import { describe, expect, it } from 'vitest';
import { loOrdinal, loSlug, loSlugsByFolder, sortLoFolders } from './lo-slug';

describe('loSlug', () => {
  it('strips the lo-NN- authoring-order prefix', () => {
    expect(loSlug('lo-00-example')).toBe('example');
  });

  it('keeps every segment of a multi-word slug', () => {
    expect(loSlug('lo-01-going-to-a-cafe')).toBe('going-to-a-cafe');
  });

  it('accepts an ordinal of any width', () => {
    expect(loSlug('lo-7-intro')).toBe('intro');
    expect(loSlug('lo-100-intro')).toBe('intro');
  });

  it('rejects a folder with no lo-NN- prefix, naming it', () => {
    expect(() => loSlug('example')).toThrow(/example/);
  });

  it('rejects a folder with no slug after the ordinal', () => {
    expect(() => loSlug('lo-00-')).toThrow(/lo-00-/);
  });

  it('rejects a slug that is not url-safe kebab-case', () => {
    expect(() => loSlug('lo-00-Example_One')).toThrow(/lo-00-Example_One/);
  });
});

describe('loOrdinal', () => {
  it('reads the authoring-order number out of the folder name', () => {
    expect(loOrdinal('lo-00-example')).toBe(0);
    expect(loOrdinal('lo-07-salutations')).toBe(7);
  });

  it('reads an unpadded ordinal as the same number as a padded one', () => {
    expect(loOrdinal('lo-7-intro')).toBe(loOrdinal('lo-07-intro'));
  });

  it('rejects a malformed folder name, naming it', () => {
    expect(() => loOrdinal('stray')).toThrow(/stray/);
  });
});

describe('sortLoFolders', () => {
  it('orders by ordinal, whatever order the folders arrive in', () => {
    expect(sortLoFolders(['lo-02-vocabulary', 'lo-00-example', 'lo-01-greetings'])).toEqual([
      'lo-00-example',
      'lo-01-greetings',
      'lo-02-vocabulary',
    ]);
  });

  it('sorts the ordinal NUMERICALLY, not as text — lo-9 comes before lo-10', () => {
    // The bug this exists to prevent: alphabetical order puts "lo-10-" before
    // "lo-9-", so an unpadded course silently renders its lessons out of order.
    expect(sortLoFolders(['lo-10-tenth', 'lo-9-ninth'])).toEqual(['lo-9-ninth', 'lo-10-tenth']);
  });

  it('falls back to the folder name when two LOs share an ordinal', () => {
    expect(sortLoFolders(['lo-01-beta', 'lo-01-alpha'])).toEqual(['lo-01-alpha', 'lo-01-beta']);
  });

  it('leaves the caller’s array untouched', () => {
    const folders = ['lo-01-greetings', 'lo-00-example'];

    sortLoFolders(folders);

    expect(folders).toEqual(['lo-01-greetings', 'lo-00-example']);
  });

  it('propagates a malformed folder name rather than sorting it somewhere', () => {
    expect(() => sortLoFolders(['lo-00-example', 'stray'])).toThrow(/stray/);
  });
});

describe('loSlugsByFolder', () => {
  it('maps every folder to its slug, preserving order', () => {
    expect([...loSlugsByFolder(['lo-00-example', 'lo-01-salutations'])]).toEqual([
      ['lo-00-example', 'example'],
      ['lo-01-salutations', 'salutations'],
    ]);
  });

  it('rejects two folders that would write the same page, naming both', () => {
    expect(() => loSlugsByFolder(['lo-00-example', 'lo-01-example'])).toThrow(
      /lo-00-example.*lo-01-example|lo-01-example.*lo-00-example/s,
    );
  });

  it('propagates a malformed folder name', () => {
    expect(() => loSlugsByFolder(['lo-00-example', 'stray'])).toThrow(/stray/);
  });
});
