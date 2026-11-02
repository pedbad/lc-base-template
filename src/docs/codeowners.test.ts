/**
 * codeowners.test.ts — `.github/CODEOWNERS` follows the path policy (TODO §E41).
 *
 * The policy, by path AND purpose, so no whole folder is exempt: a course author merges
 * without review only their course's own lessons, `lo-config/lo-NN-slug/`, and those
 * lessons' media, `public/images/lo-NN-slug/` and `public/audio/lo-NN-slug/`. The
 * template's own files inside those three folders (the example lesson and its media,
 * the footer logos, the engines' and showcase's shared media, any loose file) and
 * everything else in the repo need the maintainer's review. The table authors read is
 * COURSE_GUIDE.md, "What you may edit".
 *
 * `isLessonContent` below is that policy as a predicate. The test checks CODEOWNERS
 * against it two ways: every file actually in the three folders (so it holds in a
 * course repo too, where authors have added lessons), and named paths for the cases a
 * folder walk might not meet. GitHub's own reading of the file is checked on the pull
 * request (its CODEOWNERS errors API); whether a course repo's rules then enforce it is
 * the organisation pilot (docs/ORGANIZATION.md).
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ownersOf, parseCodeowners, patternToRegExp } from './codeowners';
import { REPO_ROOT } from './docs-tree';

const MAINTAINER = '@pedbad';
const CONTENT_FOLDERS = ['lo-config', 'public/images', 'public/audio'];

/** A course's own lesson or lesson media: a `lo-*` folder in one of the three, not the example. */
function isLessonContent(file: string): boolean {
  return /^(lo-config|public\/images|public\/audio)\/lo-(?!00-example\/)[^/]+\/./.test(file);
}

function filesUnder(folder: string): string[] {
  const root = path.join(REPO_ROOT, folder);
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(REPO_ROOT, path.join(entry.parentPath, entry.name)))
    .map((file) => file.split(path.sep).join('/'));
}

const rules = parseCodeowners(readFileSync(path.join(REPO_ROOT, '.github/CODEOWNERS'), 'utf8'));

describe('patternToRegExp', () => {
  it('anchors a leading slash at the repo root', () => {
    expect(patternToRegExp('/docs/specs/').test('docs/specs/a.md')).toBe(true);
    expect(patternToRegExp('/docs/specs/').test('src/docs/specs/a.md')).toBe(false);
  });

  it('matches a pattern without a slash at any depth', () => {
    expect(patternToRegExp('*').test('src/a/b.ts')).toBe(true);
    expect(patternToRegExp('*.md').test('docs/a.md')).toBe(true);
    expect(patternToRegExp('logs').test('a/logs/b.txt')).toBe(true);
  });

  it('treats a trailing slash as a folder: its contents, never a file of that name', () => {
    expect(patternToRegExp('/public/images/lo-*/').test('public/images/lo-01-a/x.svg')).toBe(true);
    expect(patternToRegExp('/public/images/lo-*/').test('public/images/lo-placeholder.svg')).toBe(
      false,
    );
  });

  it('keeps * inside one segment and lets ** cross them', () => {
    expect(patternToRegExp('/lo-config/lo-*/').test('lo-config/lo-01-a/blocks/b.json')).toBe(true);
    expect(patternToRegExp('/a/*.ts').test('a/b/c.ts')).toBe(false);
    expect(patternToRegExp('/a/**/c.ts').test('a/b/d/c.ts')).toBe(true);
    expect(patternToRegExp('/a/**/c.ts').test('a/c.ts')).toBe(true);
    expect(patternToRegExp('**/logs').test('x/y/logs/z')).toBe(true);
  });

  it('matches a file pattern exactly, or a folder of that name', () => {
    expect(patternToRegExp('/package.json').test('package.json')).toBe(true);
    expect(patternToRegExp('/package.json').test('package.json.bak')).toBe(false);
    expect(patternToRegExp('/tsconfig*.json').test('tsconfig.app.json')).toBe(true);
  });
});

describe('parseCodeowners', () => {
  it('reads patterns and owners, skipping comments, blanks and inline comments', () => {
    const parsed = parseCodeowners('# head\n\n*  @a @b\n/x/   # no owner\n/y/ @c # note\n');
    expect(parsed.map((r) => [r.pattern, r.owners])).toEqual([
      ['*', ['@a', '@b']],
      ['/x/', []],
      ['/y/', ['@c']],
    ]);
  });

  it('refuses the gitignore syntax GitHub does not support', () => {
    expect(() => parseCodeowners('!/x/ @a')).toThrow(/line 1/);
    expect(() => parseCodeowners('\n/x/[ab]/ @a')).toThrow(/line 2/);
  });

  it('gives the last matching rule, and undefined when none matches', () => {
    const parsed = parseCodeowners('/a/ @x\n/a/b/\n');
    expect(ownersOf(parsed, 'a/c.ts')).toEqual(['@x']);
    expect(ownersOf(parsed, 'a/b/c.ts')).toEqual([]);
    expect(ownersOf(parsed, 'z.ts')).toBeUndefined();
  });
});

describe('.github/CODEOWNERS follows the path policy', () => {
  it('names the maintainer as the owner of everything by default', () => {
    expect(ownersOf(rules, 'some/new/file.ts')).toEqual([MAINTAINER]);
  });

  it.each(CONTENT_FOLDERS)('agrees with the policy for every file in %s/', (folder) => {
    const wrong = filesUnder(folder).filter((file) => {
      const owners = ownersOf(rules, file) ?? [];
      return isLessonContent(file) ? owners.length > 0 : !owners.includes(MAINTAINER);
    });
    expect(wrong).toEqual([]);
  });

  it.each([
    'lo-config/lo-05-weather/lo.json',
    'lo-config/lo-05-weather/blocks/01-text/block.json',
    'lo-config/lo-05-weather/exercises/02-select/exercise.json',
    'lo-config/lo-12-food/modals/menu/modal.json',
    'lo-config/lo-12-food/hovers/term/hover.json',
    'public/images/lo-05-weather/hero.webp',
    'public/images/lo-05-weather/card.webp',
    'public/images/lo-05-weather/03-intro/illustration.svg',
    'public/audio/lo-05-weather/01-dialogue.m4a',
  ])('an author merges %s without review', (file) => {
    expect(isLessonContent(file)).toBe(true);
    expect(ownersOf(rules, file)).toEqual([]);
  });

  it.each([
    // the template's example lesson and its media
    'lo-config/lo-00-example/lo.json',
    'lo-config/lo-00-example/exercises/01-select/exercise.json',
    'public/images/lo-00-example/hero.svg',
    'public/audio/lo-00-example/placeholder.m4a',
    // shared media: institutional logos, engine and showcase assets
    'public/images/footer/lc-logo-black.svg',
    'public/images/line-match/circle.svg',
    'public/images/placeholders/reading.svg',
    'public/images/lo-placeholder.svg',
    'public/audio/showcase-demo/flashcards/a.m4a',
    // in a content folder, but not a lesson's own folder
    'lo-config/README.md',
    'public/images/card.webp',
    'public/audio/clip.m4a',
    'public/images/course/banner.webp',
    // course identity, and the machinery that enforces this policy
    'src/config/course.config.ts',
    'public/logo.svg',
    'public/favicon.svg',
    '.github/CODEOWNERS',
    '.github/workflows/ci.yml',
    '.husky/pre-push',
    'package.json',
    'src/exercises/select/SelectExercise.tsx',
    'src/docs/codeowners.test.ts',
  ])('%s needs the maintainer', (file) => {
    expect(isLessonContent(file)).toBe(false);
    expect(ownersOf(rules, file)).toContain(MAINTAINER);
  });
});
