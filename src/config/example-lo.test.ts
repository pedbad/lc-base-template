/**
 * example-lo.test.ts — validates the shipped example LO (`lo-config/lo-00-example`)
 * end to end, on disk. This is the seed of Phase C guards b + e: it proves the
 * example an author copies from is internally consistent BEFORE the loader/renderer
 * (Part C) exists.
 *
 * What it checks (fast, node, no DOM):
 *   1. `lo.json` parses against `LoManifestSchema`.
 *   2. Every folder named in `blocks[]` / `exercises[]` exists on disk (guard b seed:
 *      the manifest ref ↔ render-mirror folder match).
 *   3. Every `block.json` parses against `BlockConfigSchema`.
 *   4. Every `exercise.json` parses against its per-`type` engine schema (guard e
 *      seed: the `type` must resolve to a shipped engine schema, and `content` must
 *      satisfy that engine's tightened shape — not just the loose envelope).
 *
 * Spec: docs/specs/lo-semantic-structure.md §1a;
 *       docs/process/2026-08-02-phase-c-part-b-example-lo-handover.md §3.
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { LoManifestSchema, BlockConfigSchema } from './lo-schema';
import { SelectExerciseConfigSchema } from '@/exercises/select/select-schema';
import { RadioQuizExerciseConfigSchema } from '@/exercises/radio-quiz/radio-quiz-schema';

/** The example LO folder, resolved from this test file (repo-root independent). */
const LO_DIR = path.resolve(import.meta.dirname, '../../lo-config/lo-00-example');

/**
 * Per-`type` exercise schema lookup. Only the engines the example LO actually uses
 * need an entry — an unmapped `type` fails the test loudly (guard e seed).
 */
const EXERCISE_SCHEMA_BY_TYPE: Record<string, z.ZodTypeAny> = {
  select: SelectExerciseConfigSchema,
  'radio-quiz': RadioQuizExerciseConfigSchema,
};

const readJson = (filePath: string): unknown => JSON.parse(readFileSync(filePath, 'utf-8'));

describe('example LO (lo-00-example)', () => {
  const manifest = LoManifestSchema.parse(readJson(path.join(LO_DIR, 'lo.json')));

  it('manifest parses and carries ordered block/exercise refs', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
    expect(manifest.blocks.length).toBeGreaterThan(0);
    expect(manifest.exercises.length).toBeGreaterThan(0);
  });

  it.each(manifest.blocks)('block "%s" folder exists and parses', (ref) => {
    const file = path.join(LO_DIR, 'blocks', ref, 'block.json');
    expect(existsSync(file), `missing ${file}`).toBe(true);
    expect(() => BlockConfigSchema.parse(readJson(file))).not.toThrow();
  });

  it.each(manifest.exercises)(
    'exercise "%s" folder exists and parses against its engine schema',
    (ref) => {
      const file = path.join(LO_DIR, 'exercises', ref, 'exercise.json');
      expect(existsSync(file), `missing ${file}`).toBe(true);
      const raw = readJson(file) as { type?: string };
      const schema = raw.type ? EXERCISE_SCHEMA_BY_TYPE[raw.type] : undefined;
      expect(schema, `no schema mapped for exercise type "${raw.type}"`).toBeDefined();
      expect(() => schema!.parse(raw)).not.toThrow();
    },
  );
});
