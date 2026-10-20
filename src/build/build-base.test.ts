/**
 * build-base.test.ts — the base a build uses (`./` unless BASE_URL names a fixed one),
 * and the folder the browser tests serve the built site from.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_BASE, buildBase, servePath } from './build-base';

describe('buildBase', () => {
  it('is ./ when BASE_URL is not set: one build for any folder', () => {
    expect(DEFAULT_BASE).toBe('./');
    expect(buildBase({})).toBe('./');
  });

  it('is ./ when BASE_URL is set but empty, as an unset shell variable expands', () => {
    expect(buildBase({ BASE_URL: '' })).toBe('./');
  });

  it('keeps a fixed address when BASE_URL names one', () => {
    expect(buildBase({ BASE_URL: '/courses/spanish-1/' })).toBe('/courses/spanish-1/');
    expect(buildBase({ BASE_URL: '/' })).toBe('/');
  });
});

describe('servePath', () => {
  it('is / for a ./ build when no folder is named', () => {
    expect(servePath({})).toBe('/');
  });

  it('is SERVE_PATH for a ./ build: the same files, served from any folder', () => {
    expect(servePath({ SERVE_PATH: '/any/folder/' })).toBe('/any/folder/');
  });

  it('is a fixed BASE_URL itself, since that build works only there', () => {
    expect(servePath({ BASE_URL: '/course/' })).toBe('/course/');
    expect(servePath({ BASE_URL: '/course/', SERVE_PATH: '/elsewhere/' })).toBe('/course/');
  });

  it('always ends in a slash', () => {
    expect(servePath({ SERVE_PATH: '/any/folder' })).toBe('/any/folder/');
    expect(servePath({ BASE_URL: '/course' })).toBe('/course/');
  });
});
