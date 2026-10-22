/**
 * culp-syllabi.ts — checks on the CULP syllabus notes in `docs/culp-syllabi/` (E32).
 *
 * THE BUG CLASS. The notes are supplied by hand, as Markdown files, and they are a web:
 * every note names its language hub, the levels before and after it and its programme
 * specification, and the hubs and the index list the notes. A new or corrected file
 * that gets one strand of that web wrong breaks it quietly: the `culp-syllabus` skill
 * follows a link to a note that is not there, or never finds a level. Nothing else
 * reads these files closely. Prettier skips the folder on purpose (`.prettierignore`),
 * and md-links checks `[text](target)` links, not `[[wikilinks]]`.
 *
 * ONE SOURCE FOR THE LEVELS. The level → `level_order` table is read from the folder's
 * README, the one place it is written down, so a new level is added there and nowhere
 * else. A level the table does not list fails.
 *
 * A SMALL FRONTMATTER READER, NOT A YAML LIBRARY. The notes use three shapes only —
 * `key: value` (the value optionally in double quotes), `key: [a, b]`, and `key:` over
 * `  - item` lines — so a few lines read them with no new dependency. A note written in
 * another shape reads wrongly and fails a check, which is the outcome wanted.
 *
 * WHAT IT CANNOT CHECK: a staff member's name (there is no reliable way to tell a name
 * from other words; an email address, yes), typos, or whether the content is right.
 * Those stay with whoever supplies the notes.
 *
 * NOT IN src/guards/, for the same reason as md-links: that glob is `bun run guards`,
 * the eight spec guards. This runs in `bun run test`, which is the gate and what CI runs.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, trackedFiles } from './docs-tree';

/** A note's frontmatter: each value a string, or a list of strings. */
export type Meta = Readonly<Record<string, string | readonly string[]>>;

/** One note, by its path inside `docs/culp-syllabi/`. `meta` is null with no frontmatter. */
export type Note = {
  readonly file: string;
  readonly name: string;
  readonly meta: Meta | null;
  readonly body: string;
  readonly text: string;
};

/** A course document: a note in `syllabi/` that has frontmatter. */
type Doc = Note & { readonly meta: Meta };

export const SYLLABI_DIR = path.join(REPO_ROOT, 'docs', 'culp-syllabi');

const INDEX = 'CULP Syllabi';
const DOC_TYPES = ['syllabus', 'programme-spec', 'assessment-framework'];
/** The one document for all languages, which therefore has no `language_code`. */
const FRAMEWORK = 'assessment-framework';
const REQUIRED = ['title', 'language', 'doc_type', 'strand', 'source_date', 'tags'];
/** A printed date may give the month only (two documents do). */
const DATE = /^\d{4}-\d{2}(-\d{2})?$/;
const FILE_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const EMAIL = /[\w.%+-]+@[\w-]+(\.[\w-]+)+/;
/** A tag, not an autolink (`<https://…>`) or a "<" in prose. */
const HTML_TAG = /<\/?[a-zA-Z][a-zA-Z0-9-]*(\s[^>]*)?\/?>/g;

const unquote = (value: string): string => value.replace(/^"(.*)"$/, '$1');

/** `[a, b]` as a list, or null when the value is not one. */
function flowList(value: string): string[] | null {
  const inner = /^\[(.*)\]$/.exec(value)?.[1];
  if (inner === undefined) return null;
  return inner
    .split(',')
    .map((item) => unquote(item.trim()))
    .filter((item) => item !== '');
}

function parseMeta(block: string): Meta {
  const meta: Record<string, string | string[]> = {};
  let listKey: string | null = null;
  for (const line of block.split('\n')) {
    const item = /^\s+-\s+(.*)$/.exec(line)?.[1];
    const list = listKey === null ? undefined : meta[listKey];
    if (item !== undefined && Array.isArray(list)) {
      list.push(unquote(item.trim()));
      continue;
    }
    const pair = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (!pair) continue;
    const key = pair[1] ?? '';
    const value = (pair[2] ?? '').trim();
    listKey = value === '' ? key : null;
    meta[key] = value === '' ? [] : (flowList(value) ?? unquote(value));
  }
  return meta;
}

/** Read one note. `file` is its path inside `docs/culp-syllabi/`, with `/` separators. */
export function parseNote(file: string, text: string): Note {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  return {
    file,
    name: path.basename(file, '.md'),
    meta: match ? parseMeta(match[1] ?? '') : null,
    body: match ? (match[2] ?? '') : text,
    text,
  };
}

/** The note names a text links to: `[[name]]`, `[[name|label]]`, `[[name#heading]]`. */
export function wikilinks(text: string): string[] {
  return [...text.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g)].map((m) => (m[1] ?? '').trim());
}

/** The README's level → `level_order` table: rows like `| 10 | Basic 1, Basic |`. */
export function levelOrders(readme: string): ReadonlyMap<string, string> {
  return new Map(
    readme.split('\n').flatMap((line) => {
      const row = /^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*$/.exec(line);
      if (!row) return [];
      const order = row[1] ?? '';
      return (row[2] ?? '').split(',').map((level) => [level.trim(), order] as const);
    }),
  );
}

const str = (value: Meta[string] | undefined): string | undefined =>
  typeof value === 'string' ? value : undefined;
/** The note a `"[[name]]"` value points at; undefined for plain text such as `General`. */
const target = (value: Meta[string] | undefined): string | undefined =>
  wikilinks(str(value) ?? '')[0];
/** The notes a list of `"[[name]]"` values points at. */
const targets = (value: Meta[string] | undefined): string[] =>
  Array.isArray(value) ? value.flatMap((item: string) => wikilinks(item)) : [];

const isDoc = (note: Note): note is Doc => note.meta !== null && note.file.startsWith('syllabi/');
const docsByName = (notes: readonly Note[]): ReadonlyMap<string, Doc> =>
  new Map(notes.filter(isDoc).map((doc) => [doc.name, doc]));

function titleProblems(note: Note): string[] {
  const titles = note.body.match(/^# /gm)?.length ?? 0;
  return titles === 1 ? [] : [`${note.file}: ${titles} # titles, not one`];
}

function levelProblems(doc: Doc, levels: ReadonlyMap<string, string>): string[] {
  const level = str(doc.meta.level);
  const order = str(doc.meta.level_order);
  if ((level === undefined) !== (order === undefined)) {
    return [`${doc.file}: level and level_order go together`];
  }
  if (level === undefined) return [];
  const expected = levels.get(level);
  if (expected === undefined) {
    return [`${doc.file}: level "${level}" is not in the README's level_order table`];
  }
  return expected === order
    ? []
    : [`${doc.file}: level "${level}" is level_order ${expected} in the README, not ${order}`];
}

function docProblems(doc: Doc, levels: ReadonlyMap<string, string>): string[] {
  const { file, meta } = doc;
  const docType = str(meta.doc_type);
  const dates = ['source_date', 'document_date'].flatMap((key) => {
    const date = str(meta[key]);
    return date === undefined || DATE.test(date)
      ? []
      : [`${file}: ${key} "${date}" is not YYYY-MM-DD or YYYY-MM`];
  });
  return [
    ...(FILE_NAME.test(doc.name) ? [] : [`${file}: file name is not lowercase with dashes`]),
    ...REQUIRED.filter((key) => meta[key] === undefined).map((key) => `${file}: no ${key}`),
    ...(docType === undefined || DOC_TYPES.includes(docType)
      ? []
      : [`${file}: doc_type "${docType}" is not one of ${DOC_TYPES.join(', ')}`]),
    ...(docType === FRAMEWORK || meta.language_code !== undefined
      ? []
      : [`${file}: no language_code`]),
    ...((docType === 'programme-spec') === doc.name.endsWith('-programme-spec')
      ? []
      : [`${file}: only a programme-spec's file name ends in -programme-spec`]),
    ...levelProblems(doc, levels),
    ...dates,
    ...(meta.document_language === 'en'
      ? [`${file}: document_language: en (leave it out when the document is in English)`]
      : []),
  ];
}

/** Every language uses one `language_code`. */
function languageCodeProblems(docs: readonly Doc[]): string[] {
  const codes = new Map<string, ReadonlySet<string>>();
  for (const doc of docs) {
    const language = str(doc.meta.language);
    const code = str(doc.meta.language_code);
    if (language === undefined || code === undefined) continue;
    codes.set(language, new Set([...(codes.get(language) ?? []), code]));
  }
  return [...codes]
    .filter(([, set]) => set.size > 1)
    .map(
      ([language, set]) => `${language} has more than one language_code: ${[...set].join(', ')}`,
    );
}

/** Each note's frontmatter, file name, fields, levels and dates; one title each. */
export function checkShape(notes: readonly Note[], levels: ReadonlyMap<string, string>): string[] {
  const perNote = notes.flatMap((note) => [
    ...titleProblems(note),
    ...(note.meta === null ? [`${note.file}: no frontmatter`] : []),
    ...(isDoc(note) ? docProblems(note, levels) : []),
  ]);
  return [...perNote, ...languageCodeProblems(notes.filter(isDoc))];
}

/** `doc.field` names a note whose `back` field names `doc` again. */
function mutual(docs: ReadonlyMap<string, Doc>, field: string, back: string): string[] {
  return [...docs.values()].flatMap((doc) => {
    const other = target(doc.meta[field]);
    const otherDoc = other === undefined ? undefined : docs.get(other);
    if (otherDoc === undefined) return [];
    const backTo = target(otherDoc.meta[back]);
    return backTo === doc.name
      ? []
      : [`${doc.name}: ${field} is ${other}, whose ${back} is ${backTo ?? 'none'}`];
  });
}

function specProblems(docs: ReadonlyMap<string, Doc>): string[] {
  return [...docs.values()].flatMap((doc) => {
    const spec = target(doc.meta.programme_spec);
    const specDoc = spec === undefined ? undefined : docs.get(spec);
    const forward =
      specDoc && !targets(specDoc.meta.syllabi).includes(doc.name)
        ? [`${doc.name}: programme_spec is ${spec}, which does not list it`]
        : [];
    const backward = targets(doc.meta.syllabi).flatMap((name) => {
      const listed = docs.get(name);
      const pointsAt = listed === undefined ? doc.name : target(listed.meta.programme_spec);
      return pointsAt === doc.name
        ? []
        : [`${doc.name}: lists ${name}, whose programme_spec is ${pointsAt ?? 'none'}`];
    });
    const related = targets(doc.meta.related).flatMap((name) => {
      const other = docs.get(name);
      return other && !targets(other.meta.related).includes(doc.name)
        ? [`${doc.name}: related to ${name}, which is not related back`]
        : [];
    });
    return [...forward, ...backward, ...related];
  });
}

/** A level chain stays in one language, and its `level_order` rises. */
function chainProblems(docs: ReadonlyMap<string, Doc>): string[] {
  return [...docs.values()].flatMap((doc) => {
    const next = target(doc.meta.next_level);
    const nextDoc = next === undefined ? undefined : docs.get(next);
    if (nextDoc === undefined) return [];
    const from = Number(str(doc.meta.level_order));
    const to = Number(str(nextDoc.meta.level_order));
    return [
      ...(str(nextDoc.meta.language) === str(doc.meta.language)
        ? []
        : [`${doc.name}: next_level ${next} is in another language`]),
      ...(to > from
        ? []
        : [`${doc.name}: next_level ${next} is not a higher level_order (${from} → ${to})`]),
    ];
  });
}

/** Every `[[link]]` names a note; the links between notes run both ways. */
export function checkLinks(notes: readonly Note[]): string[] {
  const names = new Set(notes.map((note) => note.name));
  const dangling = notes.flatMap((note) =>
    [...new Set(wikilinks(note.text))]
      .filter((name) => !names.has(name))
      .map((name) => `${note.file}: [[${name}]] is not a note`),
  );
  const docs = docsByName(notes);
  return [
    ...dangling,
    ...mutual(docs, 'next_level', 'previous_level'),
    ...mutual(docs, 'previous_level', 'next_level'),
    ...specProblems(docs),
    ...chainProblems(docs),
  ];
}

/** Every document is in its language hub and its strand hub; every hub is in the index. */
export function checkHubs(notes: readonly Note[]): string[] {
  const byName = new Map(notes.map((note) => [note.name, note]));
  const inHubs = notes.filter(isDoc).flatMap((doc) =>
    ['language', 'strand'].flatMap((field) => {
      const hubName = target(doc.meta[field]);
      const hub = hubName === undefined ? undefined : byName.get(hubName);
      return hub && !wikilinks(hub.body).includes(doc.name)
        ? [`${doc.file}: not listed in [[${hubName}]]`]
        : [];
    }),
  );
  const index = byName.get(INDEX);
  if (index === undefined) return [...inHubs, `no ${INDEX}.md in docs/culp-syllabi/`];
  const indexed = wikilinks(index.body);
  const inIndex = notes
    .filter((note) => note.file.startsWith('languages/') || note.file.startsWith('strands/'))
    .filter((hub) => !indexed.includes(hub.name))
    .map((hub) => `${INDEX} does not list [[${hub.name}]]`);
  return [...inHubs, ...inIndex];
}

/** No email address, and no HTML. */
export function checkPrivacy(notes: readonly Note[]): string[] {
  return notes.flatMap((note) => [
    ...(EMAIL.test(note.text) ? [`${note.file}: an email address`] : []),
    ...[...note.text.matchAll(HTML_TAG)].map((tag) => `${note.file}: HTML ${tag[0]}`),
  ]);
}

/** The numbers the README gives, each with what it counts. */
const README_NUMBERS: readonly { readonly pattern: RegExp; readonly counts: readonly string[] }[] =
  [
    { pattern: /(\d+)\s+documents\s+in\s+(\d+)\s+languages/, counts: ['documents', 'languages'] },
    {
      pattern: /(\d+)\s+notes,\s+one\s+per\s+document:\s+(\d+)\s+syllabi,\s+(\d+)\s+programme/,
      counts: ['documents', 'syllabi', 'programme specifications'],
    },
    { pattern: /(\d+)\s+hubs,\s+one\s+per\s+language/, counts: ['languages'] },
    { pattern: /(\d+)\s+hubs:/, counts: ['strand hubs'] },
    {
      pattern: /\((\d+)\s+of\s+(\d+)\s+do\s+not\)/,
      counts: ['documents without a document_date', 'documents'],
    },
  ];

/** The README's numbers match the folder, so adding a note means updating them. */
export function checkReadmeCounts(notes: readonly Note[], readme: string): string[] {
  const docs = notes.filter(isDoc);
  const ofType = (docType: string) => docs.filter((doc) => doc.meta.doc_type === docType).length;
  const actual: Readonly<Record<string, number>> = {
    documents: docs.length,
    languages: notes.filter((note) => note.file.startsWith('languages/')).length,
    syllabi: ofType('syllabus'),
    'programme specifications': ofType('programme-spec'),
    'strand hubs': notes.filter((note) => note.file.startsWith('strands/')).length,
    'documents without a document_date': docs.filter((doc) => !doc.meta.document_date).length,
  };
  return README_NUMBERS.flatMap(({ pattern, counts }) => {
    const found = pattern.exec(readme);
    if (!found) return [`README no longer says how many ${counts.join(' and ')}`];
    return counts.flatMap((count, i) => {
      const said = Number(found[i + 1]);
      return said === actual[count]
        ? []
        : [`README says ${said} ${count}, but there are ${actual[count]}`];
    });
  });
}

/** Every note in the folder, read from disk so a new one is checked before it is staged. */
export function loadNotes(dir: string = SYLLABI_DIR): Note[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .map((file) => file.split(path.sep).join('/'))
    .filter((file) => file.endsWith('.md') && file !== 'README.md')
    .filter((file) => !file.split('/').some((part) => part.startsWith('.')))
    .sort()
    .map((file) => parseNote(file, readFileSync(path.join(dir, file), 'utf8')));
}

/** Tracked files in the folder that are not Markdown: there should be none. */
export function trackedNonMarkdown(): string[] {
  return trackedFiles().filter(
    (file) => file.startsWith('docs/culp-syllabi/') && !file.endsWith('.md'),
  );
}
