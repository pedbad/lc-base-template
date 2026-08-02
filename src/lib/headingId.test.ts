/**
 * Tests for headingId — the ONE heading-id scheme (spec §5). french-lo-1 computed
 * heading ids two different ways depending on whether a `target` prop was present;
 * this single helper is what every section + accordion uses so ids never drift.
 */
import { describe, expect, test } from 'vitest';
import { headingId } from './headingId';

describe('headingId', () => {
  test('appends the -heading suffix to a base id', () => {
    expect(headingId('grammar')).toBe('grammar-heading');
    expect(headingId('grammar-1')).toBe('grammar-1-heading');
  });

  test('is deterministic — same input always yields the same id', () => {
    expect(headingId('exercises')).toBe(headingId('exercises'));
  });
});
