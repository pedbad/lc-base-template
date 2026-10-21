/**
 * page-names.test.ts — the course's own page names, and the output check that stops a
 * lesson page overwriting a file the build already wrote (review 2026-10-21, concern 2).
 */
import { describe, expect, it } from 'vitest';
import { DEBUG_ENTRY_FILES, RESERVED_PAGE_SLUGS, findPageCollisions } from './page-names';

describe('RESERVED_PAGE_SLUGS', () => {
  it('holds the course home and every debug page, built or not', () => {
    expect(RESERVED_PAGE_SLUGS).toEqual([
      'index',
      ...Object.values(DEBUG_ENTRY_FILES).map((file) => file.replace(/\.html$/, '')),
    ]);
  });
});

describe('findPageCollisions', () => {
  it('finds nothing when every lesson page is new', () => {
    expect(findPageCollisions(['example.html', 'cafe.html'], ['index.html', 'robots.txt'])).toEqual(
      [],
    );
  });

  it('names a lesson page the build already wrote, such as a public/ file', () => {
    expect(
      findPageCollisions(['example.html', 'about.html'], ['index.html', 'about.html']),
    ).toEqual(['about.html']);
  });

  it('names a lesson page planned twice', () => {
    expect(findPageCollisions(['example.html', 'example.html'], [])).toEqual(['example.html']);
  });
});
