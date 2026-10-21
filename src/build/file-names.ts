/**
 * file-names.ts — the naming shapes every file and folder in `src/` takes
 * (docs/STYLE.md, "Files and names"), read by file-names.test.ts.
 *
 * THE RULE. A name is its part before the first dot, plus optional lowercase qualifiers
 * after it (`course.config.ts`, `ExerciseHost.progress.test.tsx`, `sandbox-docs.d.ts`).
 * The name is one of three shapes:
 *
 *   - kebab-case — any plain module, stylesheet, entry or folder (`flip-cue-store.ts`);
 *   - `use` + PascalCase — a hook (`useFlipCue.ts`);
 *   - PascalCase — a component, a class or a React context (`ProgressMeter.tsx`,
 *     `AudioManager.ts`, `FlipCueContext.ts`).
 *
 * What it rules out is camelCase (`charDiff.ts`), snake_case and anything else: eleven
 * camelCase modules were renamed to kebab-case on 2026-10-21, before the organisation
 * move, and this keeps it so. Folders take kebab-case only.
 */

export type NameShape = 'kebab' | 'hook' | 'pascal';

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HOOK = /^use[A-Z][A-Za-z0-9]*$/;
const PASCAL = /^[A-Z][A-Za-z0-9]*$/;

/** The shape of a file or folder name, or null when it takes none of them. */
export function nameShape(name: string): NameShape | null {
  const [base = '', ...qualifiers] = name.split('.');
  if (!qualifiers.every((qualifier) => KEBAB.test(qualifier))) return null;
  if (KEBAB.test(base)) return 'kebab';
  // A folder has no extension, and folders take kebab-case only.
  if (qualifiers.length === 0) return null;
  if (HOOK.test(base)) return 'hook';
  if (PASCAL.test(base)) return 'pascal';
  return null;
}

/**
 * The paths, of those given, whose own last segment takes no shape. Paths are
 * `/`-separated and relative; a folder ends in `/`.
 */
export function findMisnamed(paths: readonly string[]): string[] {
  return paths.filter((entry) => {
    const segment = entry.replace(/\/$/, '').split('/').at(-1) ?? '';
    return nameShape(segment) === null;
  });
}
