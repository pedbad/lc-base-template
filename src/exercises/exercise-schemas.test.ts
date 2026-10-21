/**
 * exercise-schemas.test.ts — the type → schema registry the LO assembler validates
 * every exercise with (review 2026-10-21, concern 1).
 */
import { describe, expect, it } from 'vitest';
import { EXERCISE_TYPE_KEYS } from '@/config/exercise-types';
import { SHOWCASE_FIXTURES } from '@/showcase/fixtures';
import { EXERCISE_CONFIG_SCHEMAS, exerciseConfigSchema } from './exercise-schemas';

describe('EXERCISE_CONFIG_SCHEMAS', () => {
  it('has exactly one schema per canonical exercise type', () => {
    expect(Object.keys(EXERCISE_CONFIG_SCHEMAS).sort()).toEqual([...EXERCISE_TYPE_KEYS].sort());
  });

  it.each(SHOWCASE_FIXTURES.map((fixture) => [fixture.id, fixture] as const))(
    'accepts the %s showcase fixture',
    (_id, fixture) => {
      const result = exerciseConfigSchema(fixture.type).safeParse(fixture.config);
      expect(result.error?.issues ?? []).toEqual([]);
    },
  );

  it.each(EXERCISE_TYPE_KEYS)('pins %s to its own type', (type) => {
    const fixture = SHOWCASE_FIXTURES.find((entry) => entry.type === type);
    const other = EXERCISE_TYPE_KEYS.find((key) => key !== type);
    const config = { ...(fixture?.config as object), type: other };
    expect(exerciseConfigSchema(type).safeParse(config).success).toBe(false);
  });

  it.each(EXERCISE_TYPE_KEYS)('refuses %s with empty content', (type) => {
    expect(exerciseConfigSchema(type).safeParse({ type, content: {} }).success).toBe(false);
  });
});
