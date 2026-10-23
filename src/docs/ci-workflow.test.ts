/**
 * ci-workflow.test.ts — keeps `.github/workflows/ci.yml` in step with the branch
 * protection that depends on it, and keeps the browser job's system packages bounded
 * (TODO §E38).
 *
 * The check names: `main` requires five checks by name (docs/BRANCH_PROTECTION.md).
 * Rename a job or change its matrix and every merge waits forever for a check that no
 * longer reports, so the names the workflow produces must be the five that doc sets.
 *
 * The system packages: an Ubuntu mirror sometimes serves a runner at 50–100 kB/s without
 * ever failing, and an unbounded `apt-get` then runs until the job's timeout cancels a
 * required check (four times on 2026-10-22/23). So apt is reached from one step only,
 * every try in it has a time limit, all the tries fit inside the step's own limit, and
 * that inside the job's. The packages it downloads are cached in a folder that step
 * reads, under a key that changes with the runner image.
 *
 * Reads the workflow as YAML and the doc as text. Not in src/guards/: see the header of
 * docs-tree.test.ts for what that folder holds.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { REPO_ROOT } from './docs-tree';

type Step = {
  name?: string;
  if?: string;
  uses?: string;
  run?: string;
  with?: Record<string, string>;
  env?: Record<string, string | number>;
  'timeout-minutes'?: number;
};
type Job = {
  name?: string;
  'timeout-minutes'?: number;
  strategy?: { matrix?: Record<string, unknown[]> };
  steps: Step[];
};

const workflow = parse(
  readFileSync(path.join(REPO_ROOT, '.github', 'workflows', 'ci.yml'), 'utf8'),
) as { jobs: Record<string, Job> };
const protection = readFileSync(path.join(REPO_ROOT, 'docs', 'BRANCH_PROTECTION.md'), 'utf8');

/** Every combination of a matrix's values, in the order GitHub lists them. */
function combinations(matrix: Record<string, unknown[]>): Record<string, unknown>[] {
  return Object.entries(matrix).reduce<Record<string, unknown>[]>(
    (rows, [key, values]) =>
      rows.flatMap((row) => values.map((value) => ({ ...row, [key]: value }))),
    [{}],
  );
}

/**
 * Fills a job name's `${{ }}` expressions for one matrix row. Only the two shapes the
 * workflow uses: `matrix.a.b`, and `matrix.a && 'x' || 'y'`. Anything else throws, so a
 * new shape is a failing test, not a wrong name.
 */
function fillName(template: string, row: Record<string, unknown>): string {
  const lookup = (ref: string): unknown =>
    ref
      .replace(/^matrix\./, '')
      .split('.')
      .reduce<unknown>((value, key) => (value as Record<string, unknown>)[key], row);
  return template.replace(/\$\{\{\s*(.+?)\s*\}\}/g, (_, expression: string) => {
    const choice = /^(matrix\.[\w.]+) && '([^']*)' \|\| '([^']*)'$/.exec(expression);
    if (choice) return lookup(choice[1]) ? choice[2] : choice[3];
    if (/^matrix\.[\w.]+$/.test(expression)) return String(lookup(expression));
    throw new Error(`ci-workflow.test.ts cannot read \${{ ${expression} }}`);
  });
}

function checkNames(jobs: Record<string, Job>): string[] {
  return Object.entries(jobs).flatMap(([id, job]) => {
    const template = job.name ?? id;
    const matrix = job.strategy?.matrix;
    return matrix ? combinations(matrix).map((row) => fillName(template, row)) : [template];
  });
}

/** The `contexts` list in the doc's gh CLI command: what `main` requires today. */
function requiredChecks(doc: string): string[] {
  const list = /"contexts": \[([^\]]*)\]/.exec(doc);
  if (!list) throw new Error('docs/BRANCH_PROTECTION.md has no "contexts" list');
  return [...list[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

const e2e = workflow.jobs.e2e;
const APT = /apt-get|install-deps|--with-deps|dpkg/;
const SYSTEM_PACKAGES = 'Install browser system libraries';
const install = e2e.steps.find((step) => step.name === SYSTEM_PACKAGES);

describe('ci.yml — the checks main requires', () => {
  it('reports exactly the five check names docs/BRANCH_PROTECTION.md requires', () => {
    expect(checkNames(workflow.jobs).sort()).toEqual(requiredChecks(protection).sort());
    expect(checkNames(workflow.jobs)).toHaveLength(5);
  });
});

describe('ci.yml — the browser job’s system packages', () => {
  it('reaches apt from one step only, on every path, cached browsers or not', () => {
    const aptSteps = e2e.steps.filter((step) => APT.test(step.run ?? ''));
    expect(aptSteps.map((step) => step.name)).toEqual([SYSTEM_PACKAGES]);
    expect(install?.if).toBeUndefined();
  });

  it('limits each try, and fits every try inside the step’s limit and that inside the job’s', () => {
    const tries = Number(install?.env?.TRIES);
    const trySeconds = Number(install?.env?.TRY_SECONDS);
    const killAfter = Number(
      /timeout --kill-after=(\d+)s "\$\{?TRY_SECONDS/.exec(install?.run ?? '')?.[1],
    );
    const stepMinutes = install?.['timeout-minutes'] ?? Infinity;

    expect(tries).toBeGreaterThan(1);
    expect(trySeconds).toBeGreaterThan(0);
    expect(killAfter).toBeGreaterThan(0);
    expect(tries * (trySeconds + killAfter)).toBeLessThanOrEqual(stepMinutes * 60);
    expect(stepMinutes).toBeLessThan(e2e['timeout-minutes'] ?? Infinity);
  });

  it('caches the downloaded packages in the folder that step reads, refreshed per runner image', () => {
    const caches = e2e.steps.filter(
      (step) =>
        step.uses?.startsWith('actions/cache@') &&
        step.run === undefined &&
        /apt/.test(step.with?.path ?? ''),
    );
    expect(caches).toHaveLength(1);
    const [cache] = caches;
    expect(install?.run).toContain(cache.with?.path);
    expect(cache.with?.key).toContain('image-version');
    expect(cache.with?.['restore-keys']).toBeTruthy();
  });
});
