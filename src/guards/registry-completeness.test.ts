/**
 * registry-completeness.test.ts — guard e (buildlist 23).
 *
 * Each `it` that names a violation is a DELIBERATELY BROKEN sample proved to be
 * caught; the sweeps at the bottom then assert the real repo is clean. A guard whose
 * failure nobody has watched may simply be asleep.
 */
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { EXERCISE_TYPE_KEYS } from '@/config/exercise-types';
import { EXERCISE_REGISTRY } from '@/exercises/lazyRegistry';
import { BLOCK_RENDERERS } from '@/lo/blocks/block-renderers';
import { SHOWCASE_FIXTURES } from '@/showcase/fixtures';
import {
  CONTRACT_STEPS,
  authoredTypeRefs,
  findContractGaps,
  findUnresolvedTypes,
  hasSchemaFile,
  schemaFileFor,
} from './registry-completeness';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

/** Everything the contract wants, so a sample can break exactly one step. */
const completeContract = {
  keys: ['select', 'reading'],
  registered: ['select', 'reading'],
  fixtureTypes: ['select', 'reading'],
  typesWithSchema: ['select', 'reading'],
} as const;

describe('findContractGaps — the three-step authoring contract', () => {
  it('passes a type that took all three steps', () => {
    expect(findContractGaps(completeContract)).toEqual([]);
  });

  it('flags a canonical key with no engine in the registry', () => {
    const found = findContractGaps({ ...completeContract, registered: ['select'] });
    expect(found).toHaveLength(1);
    expect(found[0]?.type).toBe('reading');
    expect(found[0]?.step).toBe('engine');
    expect(found[0]?.detail).toContain('lazyRegistry');
  });

  it('flags a registered engine nobody can see — no showcase fixture', () => {
    const found = findContractGaps({ ...completeContract, fixtureTypes: ['select'] });
    expect(found).toHaveLength(1);
    expect(found[0]?.step).toBe('fixture');
  });

  it('flags an engine with no per-type Zod content schema', () => {
    const found = findContractGaps({ ...completeContract, typesWithSchema: ['select'] });
    expect(found).toHaveLength(1);
    expect(found[0]?.step).toBe('schema');
    expect(found[0]?.detail).toBe('src/exercises/reading/reading-schema.ts');
  });

  it('reports every skipped step for the same type, not just the first', () => {
    const found = findContractGaps({
      keys: ['reading'],
      registered: [],
      fixtureTypes: [],
      typesWithSchema: [],
    });
    expect(found.map((gap) => gap.step)).toEqual([...CONTRACT_STEPS]);
  });

  it('counts a type with several fixtures once, not once per card', () => {
    expect(
      findContractGaps({ ...completeContract, fixtureTypes: ['select', 'select', 'reading'] }),
    ).toEqual([]);
  });
});

describe('findUnresolvedTypes — an authored type with nothing behind it', () => {
  const resolvers = { exercise: ['select'], block: ['prose'] };

  it('flags an exercise type that resolves to no engine', () => {
    const found = findUnresolvedTypes(
      [
        {
          source: 'lo-config/lo-01-x/exercises/01-quiz/exercise.json',
          kind: 'exercise',
          type: 'quiz',
        },
      ],
      resolvers,
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.type).toBe('quiz');
    expect(found[0]?.source).toContain('01-quiz');
  });

  // Block `type` is a free string in BlockConfigSchema — no Zod enum stands behind it,
  // so this direction is the only thing checking it at all.
  it('flags a block type that resolves to no renderer', () => {
    const found = findUnresolvedTypes(
      [{ source: 'lo-config/lo-01-x/blocks/01-notes/block.json', kind: 'block', type: 'notes' }],
      resolvers,
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.kind).toBe('block');
  });

  it('passes types that resolve, and keeps the two kinds apart', () => {
    expect(
      findUnresolvedTypes(
        [
          { source: 'a.json', kind: 'exercise', type: 'select' },
          { source: 'b.json', kind: 'block', type: 'prose' },
        ],
        resolvers,
      ),
    ).toEqual([]);
    // `prose` is a block renderer, never an engine — resolving across kinds would be
    // the bug, so a block type used as an exercise type must still fail.
    expect(
      findUnresolvedTypes([{ source: 'c.json', kind: 'exercise', type: 'prose' }], resolvers),
    ).toHaveLength(1);
  });

  it('flags a config with no `type` at all rather than skipping it', () => {
    expect(
      findUnresolvedTypes([{ source: 'd.json', kind: 'block', type: '' }], resolvers),
    ).toHaveLength(1);
  });
});

describe('schemaFileFor — the conventional home of a per-type schema', () => {
  it('names `<type>/<type>-schema.ts` under src/exercises', () => {
    expect(schemaFileFor('drag-fill-gaps')).toBe(
      'src/exercises/drag-fill-gaps/drag-fill-gaps-schema.ts',
    );
  });

  it('reports a schema file that is not there', () => {
    expect(hasSchemaFile(REPO_ROOT, 'select')).toBe(true);
    expect(hasSchemaFile(REPO_ROOT, 'no-such-engine')).toBe(false);
  });
});

describe('the repo itself obeys guard e', () => {
  const registered = Object.keys(EXERCISE_REGISTRY);
  const fixtureTypes = SHOWCASE_FIXTURES.map((fixture) => fixture.type);
  const typesWithSchema = EXERCISE_TYPE_KEYS.filter((type) => hasSchemaFile(REPO_ROOT, type));
  const authored = authoredTypeRefs();

  // If a registry is renamed or a config field reshaped, a collector that finds
  // nothing would report success and switch the guard off. These are the floors.
  it('found keys, registries and authored types to check (nothing has gone stale)', () => {
    expect(CONTRACT_STEPS.length).toBe(3);
    expect(EXERCISE_TYPE_KEYS.length).toBeGreaterThanOrEqual(15);
    expect(registered.length).toBeGreaterThan(0);
    expect(fixtureTypes.length).toBeGreaterThan(0);
    expect(Object.keys(BLOCK_RENDERERS).length).toBeGreaterThan(0);
    expect(
      authored.filter((ref) => ref.kind === 'exercise').length,
      'no exercise `type` found on disk — has exercise.json been reshaped?',
    ).toBeGreaterThan(0);
    expect(
      authored.filter((ref) => ref.kind === 'block').length,
      'no block `type` found on disk — has block.json been reshaped?',
    ).toBeGreaterThan(0);
  });

  it('every canonical exercise type took all three authoring steps', () => {
    const gaps = findContractGaps({
      keys: EXERCISE_TYPE_KEYS,
      registered,
      fixtureTypes,
      typesWithSchema,
    });
    expect(
      gaps,
      `the authoring contract is incomplete:\n${gaps
        .map((gap) => `  ${gap.type} — no ${gap.step}: ${gap.detail}`)
        .join('\n')}`,
    ).toEqual([]);
  });

  it('every authored block and exercise type resolves to something that renders it', () => {
    const unresolved = findUnresolvedTypes(authored, {
      exercise: registered,
      block: Object.keys(BLOCK_RENDERERS),
    });
    expect(
      unresolved,
      `these would render a red "no renderer registered" box:\n${unresolved
        .map((ref) => `  ${ref.source} → ${ref.kind} type "${ref.type}"`)
        .join('\n')}`,
    ).toEqual([]);
  });
});

describe('every per-type schema file actually exports a Zod schema', () => {
  // The contract's third step is "add a Zod schema", not "add a file called
  // …-schema.ts". Importing each one is what tells the two apart.
  it.each(EXERCISE_TYPE_KEYS)('%s', async (type) => {
    const module: Record<string, unknown> = await import(`../exercises/${type}/${type}-schema.ts`);
    const schemas = Object.values(module).filter(
      (value) =>
        typeof value === 'object' &&
        value !== null &&
        typeof (value as { safeParse?: unknown }).safeParse === 'function',
    );
    expect(schemas.length, `${schemaFileFor(type)} exports no Zod schema`).toBeGreaterThan(0);
  });
});
