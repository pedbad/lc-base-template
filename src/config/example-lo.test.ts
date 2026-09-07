/**
 * example-lo.test.ts — validates the shipped example LO (`lo-config/lo-00-example`)
 * end to end, on disk. This is the seed of Phase C guards b + e: it proves the
 * example an author copies from is internally consistent, independently of the
 * loader (`src/lo/`) that renders it.
 *
 * What it checks (fast, node, no DOM):
 *   1. `lo.json` parses against `LoManifestSchema` — ordered `sections[]`, unique
 *      ids, non-empty labels (the schema enforces the last two; the assertions
 *      below prove the shipped example exercises them).
 *   2. Every `block.json` parses against `BlockConfigSchema`.
 *   3. Every `exercise.json` parses against its per-`type` engine schema (guard e
 *      seed: the `type` must resolve to a shipped engine schema, and `content` must
 *      satisfy that engine's tightened shape — not just the loose envelope) AND
 *      carries the accordion title the LO-facing envelope requires.
 *
 * REF ↔ FOLDER EXISTENCE HAS MOVED OUT. This test's original check 2 was the guard b
 * seed — it walked the manifest and asserted every named folder was on disk. Guard b
 * (`src/guards/render-mirror.ts`) now does that for EVERY LO folder, in both
 * directions, so re-asserting it for this one LO would be pure duplication. What is
 * left here is the part guard b does not do: whether the shipped example an author
 * copies from actually satisfies its schemas.
 *
 * Spec: docs/specs/lo-semantic-structure.md §1a;
 *       docs/process/2026-08-04-phase-c-part-c-loader-handover.md §3.
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { LoManifestSchema, BlockConfigSchema, LoExerciseConfigSchema } from './lo-schema';
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

  it('manifest parses and declares its own ordered sections', () => {
    expect(manifest.title.length).toBeGreaterThan(0);
    expect(manifest.sections.length).toBeGreaterThan(1);
  });

  it('section ids are unique and every section has a non-empty label', () => {
    const ids = manifest.sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const section of manifest.sections) {
      expect(section.label.trim().length, `blank label on section "${section.id}"`).toBeGreaterThan(
        0,
      );
    }
  });

  // Decision D2: the introduction is an ordinary declared section, not a hardcoded
  // first nav entry — so the example must declare it like any other.
  it('declares the introduction as an ordinary section with content', () => {
    const intro = manifest.sections.find((section) => section.id === 'introduction');
    expect(intro, 'example LO should declare an introduction section').toBeDefined();
    expect(intro!.blocks.length + intro!.exercises.length).toBeGreaterThan(0);
  });

  // Decision D3: `navLabel` is optional, so the example exercises it at least once
  // (a heading too long for a nav bar) — otherwise the fallback path ships untested.
  it('exercises the optional navLabel override at least once', () => {
    expect(manifest.sections.some((section) => section.navLabel !== undefined)).toBe(true);
  });

  // The optional card image ships exercised, for the same reason navLabel does: the
  // landing page's image path would otherwise be untested until an author tried it.
  // The file must EXIST too (guard d seed) — a card pointing at a missing image is a
  // broken image on the course's front page.
  it('declares a landing-card image that exists under public/', () => {
    expect(manifest.image, 'example LO should exercise the optional card image').toBeDefined();
    const file = path.resolve(import.meta.dirname, '../../public', manifest.image!);
    expect(existsSync(file), `missing ${file}`).toBe(true);
  });

  const blockRefs = manifest.sections.flatMap((section) =>
    section.blocks.map((ref) => [section.id, ref] as const),
  );
  const exerciseRefs = manifest.sections.flatMap((section) =>
    section.exercises.map((ref) => [section.id, ref] as const),
  );

  it('declares at least one block and one exercise across its sections', () => {
    expect(blockRefs.length).toBeGreaterThan(0);
    expect(exerciseRefs.length).toBeGreaterThan(0);
  });

  // Folder existence is guard b's, repo-wide (see the header) — only the parse is here.
  it.each(blockRefs)('section "%s" block "%s" parses against BlockConfigSchema', (_s, ref) => {
    const file = path.join(LO_DIR, 'blocks', ref, 'block.json');
    expect(() => BlockConfigSchema.parse(readJson(file))).not.toThrow();
  });

  it.each(exerciseRefs)(
    'section "%s" exercise "%s" parses against its engine schema',
    (_sectionId, ref) => {
      const file = path.join(LO_DIR, 'exercises', ref, 'exercise.json');
      const raw = readJson(file) as { type?: string };
      const schema = raw.type ? EXERCISE_SCHEMA_BY_TYPE[raw.type] : undefined;
      expect(schema, `no schema mapped for exercise type "${raw.type}"`).toBeDefined();
      expect(() => schema!.parse(raw)).not.toThrow();
      // The per-engine schema tightens `content`; the LO-facing envelope adds the
      // accordion <h3>. An LO exercise must satisfy both.
      expect(() => LoExerciseConfigSchema.parse(raw)).not.toThrow();
    },
  );
});
