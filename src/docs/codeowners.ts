/**
 * codeowners.ts — reads `.github/CODEOWNERS` the way GitHub does, so a test can ask who
 * owns a path (TODO §E41, the path policy).
 *
 * WHAT GITHUB DOES. Each line is a pattern and its owners; for a given file the LAST
 * matching line wins, and a line with no owners makes the file ownerless. Patterns follow
 * most of gitignore: a leading `/`, or a `/` in the middle, anchors at the repo root;
 * otherwise a pattern matches at any depth; a trailing `/` matches a folder's contents
 * and never a file of that name; `*` stays inside one path segment and `**` crosses
 * them. GitHub does NOT support `!` negation or `[ ]` ranges, so a line using either is
 * refused here rather than read the way git would read it.
 *
 * WHY HERE AND NOT A LIBRARY. A gitignore library implements negation and ranges, which
 * GitHub ignores, so it would answer differently on exactly the lines that matter. This
 * is the subset GitHub documents, and nothing else.
 *
 * It does not ask GitHub. Whether GitHub reads the file without errors is checked on the
 * pull request (the CODEOWNERS errors API); this module checks what the file SAYS.
 */

export interface CodeownersRule {
  readonly pattern: string;
  readonly owners: readonly string[];
  /** 1-based line number in the file. */
  readonly line: number;
  readonly regex: RegExp;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.+^${}()|\\]/g, '\\$&');
}

/** One CODEOWNERS pattern as a regular expression over a repo-relative path (`a/b.ts`). */
export function patternToRegExp(pattern: string): RegExp {
  const folderOnly = pattern.endsWith('/');
  const body = folderOnly ? pattern.slice(0, -1) : pattern;
  const anchored = body.includes('/');
  const parts = body.replace(/^\//, '').split('/');

  const source = parts
    .map((part, index) => {
      const last = index === parts.length - 1;
      if (part === '**') return last ? '.*' : '(?:.*/)?';
      const segment = escapeRegExp(part).replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]');
      return last ? segment : `${segment}/`;
    })
    .join('');

  const prefix = anchored ? '^' : '^(?:.*/)?';
  const suffix = folderOnly ? '/.*$' : '(?:/.*)?$';
  return new RegExp(prefix + source + suffix);
}

/** Every rule in a CODEOWNERS file, in file order. Throws on syntax GitHub ignores. */
export function parseCodeowners(text: string): readonly CodeownersRule[] {
  return text.split('\n').flatMap((raw, index) => {
    const line = index + 1;
    const content = raw.trim();
    if (content === '' || content.startsWith('#')) return [];

    const [pattern, ...rest] = content.split(/\s+/);
    if (pattern.startsWith('!') || /[[\]]/.test(pattern)) {
      throw new Error(`CODEOWNERS line ${line}: GitHub does not support "${pattern}"`);
    }
    const comment = rest.findIndex((token) => token.startsWith('#'));
    const owners = comment === -1 ? rest : rest.slice(0, comment);
    return [{ pattern, owners, line, regex: patternToRegExp(pattern) }];
  });
}

/**
 * The owners of one repo-relative path: the last matching rule's owners, `[]` when that
 * rule names nobody, `undefined` when no rule matches at all.
 */
export function ownersOf(
  rules: readonly CodeownersRule[],
  file: string,
): readonly string[] | undefined {
  for (let i = rules.length - 1; i >= 0; i--) {
    if (rules[i].regex.test(file)) return rules[i].owners;
  }
  return undefined;
}
