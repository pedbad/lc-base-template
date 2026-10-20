/**
 * build-base.test.ts — the base a build uses: `./` unless BASE_URL names a fixed one.
 */
import { describe, expect, it } from 'vitest';
import { DEFAULT_BASE, buildBase } from './build-base';

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
