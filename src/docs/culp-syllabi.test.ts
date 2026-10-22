/**
 * culp-syllabi.test.ts — proves each check on the CULP syllabus notes catches the fault
 * it is for, passes the shapes the real notes use, and passes the real folder.
 *
 * The fixtures are a small made-up folder in the real notes' shape: an index, a
 * language hub, a strand hub, a level chain with its programme specification, a strand
 * course, a theme course with no level and the all-languages framework. Each fault
 * test breaks one thing in it. Not in src/guards/ — see the header of
 * `culp-syllabi.ts`.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  type Note,
  SYLLABI_DIR,
  checkHubs,
  checkLinks,
  checkPrivacy,
  checkReadmeCounts,
  checkShape,
  levelOrders,
  loadNotes,
  parseNote,
  trackedNonMarkdown,
  wikilinks,
} from './culp-syllabi';

const LEVEL_TABLE = [
  '| `level_order` | `level`                 |',
  '| ------------- | ----------------------- |',
  '| 10            | Basic 1, Basic          |',
  '| 20            | Basic 2                 |',
  '| 50            | Intermediate 1          |',
  '| 80            | Advanced                |',
].join('\n');
const LEVELS = levelOrders(LEVEL_TABLE);

const note = (file: string, meta: string, body: string): Note =>
  parseNote(file, `---\n${meta}\n---\n\n${body}`);

const syllabus = (name: string, meta: string, body = `# ${name}\n`): Note =>
  note(
    `syllabi/${name}.md`,
    `title: ${name}\n${meta}\nsource_date: 2024-11-26\ntags: [culp, syllabus]`,
    body,
  );

const french = (extra: string) =>
  `language: "[[French]]"\nlanguage_code: fr\nstrand: General\ndoc_type: syllabus\n${extra}`;

/** A small folder in the real notes' shape, with nothing wrong in it. */
function folder(): Note[] {
  return [
    note(
      'CULP Syllabi.md',
      'title: CULP Syllabi\ndoc_type: index\ntags: [culp, index]',
      '# CULP Syllabi\n\n| [[French]] | 4 |\n\n- [[Medics]]: medical students\n',
    ),
    note(
      'languages/French.md',
      'title: French\ndoc_type: language-hub\nlanguage_code: fr\ntags: [culp, language]',
      [
        '# French',
        '',
        '| [[french-basic-1]] | [[french-basic-2]] | [[french-pronunciation]] |',
        '| [[french-medics-intermediate-1]] | [[french-basic-programme-spec]] |',
      ].join('\n'),
    ),
    note(
      'strands/Medics.md',
      'title: Medics\ndoc_type: strand-hub\ntags: [culp, strand]',
      '# Medics\n\n| [[french-medics-intermediate-1]] |\n',
    ),
    syllabus(
      'french-basic-1',
      french(
        'level: Basic 1\nlevel_order: 10\nnext_level: "[[french-basic-2]]"\nprogramme_spec: "[[french-basic-programme-spec]]"',
      ),
    ),
    syllabus(
      'french-basic-2',
      french(
        'level: Basic 2\nlevel_order: 20\nprevious_level: "[[french-basic-1]]"\nprogramme_spec: "[[french-basic-programme-spec]]"\ndocument_date: 2022-03',
      ),
      '# Basic 2\n\nAfter [[french-basic-1|Basic 1]]; see [[french-basic-1#Lesson 3]].\n\n> [!important] Assessment\n> Orals\n',
    ),
    note(
      'syllabi/french-basic-programme-spec.md',
      [
        'title: "CULP Basic in French: Programme Specification"',
        'language: "[[French]]"',
        'language_code: fr',
        'level: Basic',
        'level_order: 10',
        'strand: General',
        'syllabi:',
        '  - "[[french-basic-1]]"',
        '  - "[[french-basic-2]]"',
        'doc_type: programme-spec',
        'source_date: 2012-03-19',
        'tags: [culp, programme-spec]',
      ].join('\n'),
      '# Spec\n\nSee <https://www.admin.cam.ac.uk/> and a < b.\n',
    ),
    syllabus(
      'french-medics-intermediate-1',
      'language: "[[French]]"\nlanguage_code: fr\nstrand: "[[Medics]]"\ndoc_type: syllabus\nlevel: Intermediate 1\nlevel_order: 50',
    ),
    syllabus('french-pronunciation', french('aliases: [French Pronunciation]')),
    syllabus(
      'all-languages-advanced-assessment-framework',
      'language: All languages\nlevel: Advanced\nlevel_order: 80\nstrand: General\ndoc_type: assessment-framework',
    ),
  ];
}

/** The folder with one note replaced (matched by file) or added. */
function withNote(changed: Note): Note[] {
  const rest = folder().filter((n) => n.file !== changed.file);
  return [...rest, changed];
}

/** The folder with one note's raw text edited. */
function edited(file: string, edit: (text: string) => string): Note[] {
  const original = folder().find((n) => n.file === file);
  if (!original) throw new Error(`no fixture ${file}`);
  return withNote(parseNote(file, edit(original.text)));
}

describe('parseNote', () => {
  it('reads plain, quoted, flow-list and block-list values', () => {
    const spec = folder().find((n) => n.name === 'french-basic-programme-spec');
    expect(spec?.meta).toMatchObject({
      title: 'CULP Basic in French: Programme Specification',
      language: '[[French]]',
      level_order: '10',
      syllabi: ['[[french-basic-1]]', '[[french-basic-2]]'],
      tags: ['culp', 'programme-spec'],
    });
  });

  it('gives no frontmatter, and the whole text as the body, when there is none', () => {
    const parsed = parseNote('syllabi/x.md', '# X\n\nname: not-frontmatter\n');
    expect(parsed.meta).toBeNull();
    expect(parsed.body).toBe('# X\n\nname: not-frontmatter\n');
    expect(parsed.name).toBe('x');
  });
});

describe('wikilinks', () => {
  it('finds plain, labelled and heading links, by note name', () => {
    expect(wikilinks('[[a]] [[b|label]] [[c#Heading]] [[ d ]]')).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('levelOrders', () => {
  it("reads the README's level_order table", () => {
    expect([...LEVELS]).toEqual([
      ['Basic 1', '10'],
      ['Basic', '10'],
      ['Basic 2', '20'],
      ['Intermediate 1', '50'],
      ['Advanced', '80'],
    ]);
  });
});

describe('a correct folder', () => {
  it('passes every check', () => {
    const notes = folder();
    expect([
      ...checkShape(notes, LEVELS),
      ...checkLinks(notes),
      ...checkHubs(notes),
      ...checkPrivacy(notes),
    ]).toEqual([]);
  });
});

describe('checkShape catches', () => {
  const shape = (notes: readonly Note[]) => checkShape(notes, LEVELS).join('\n');

  it('a note with no frontmatter', () => {
    expect(shape(withNote(parseNote('syllabi/x.md', '# X\n')))).toMatch(/x\.md: no frontmatter/);
  });

  it('a file name that is not lowercase with dashes', () => {
    const notes = edited('syllabi/french-basic-1.md', (t) => t);
    const renamed = notes.map((n) =>
      n.name === 'french-basic-1' ? parseNote('syllabi/French_Basic_1.md', n.text) : n,
    );
    expect(shape(renamed)).toMatch(/French_Basic_1\.md: file name/);
  });

  it('a missing required field', () => {
    expect(
      shape(edited('syllabi/french-basic-1.md', (t) => t.replace(/^strand: .*\n/m, ''))),
    ).toMatch(/french-basic-1\.md: no strand/);
  });

  it('a missing language_code, except on the all-languages framework', () => {
    expect(
      shape(edited('syllabi/french-basic-1.md', (t) => t.replace(/^language_code: .*\n/m, ''))),
    ).toMatch(/french-basic-1\.md: no language_code/);
  });

  it('an unknown doc_type', () => {
    expect(
      shape(
        edited('syllabi/french-basic-1.md', (t) =>
          t.replace('doc_type: syllabus', 'doc_type: notes'),
        ),
      ),
    ).toMatch(/french-basic-1\.md: doc_type "notes"/);
  });

  it('a programme specification whose name does not say so, and the other way round', () => {
    const notes = edited('syllabi/french-basic-1.md', (t) =>
      t.replace('doc_type: syllabus', 'doc_type: programme-spec'),
    );
    expect(shape(notes)).toMatch(/french-basic-1\.md: .*programme-spec/);
  });

  it('a level without a level_order', () => {
    expect(
      shape(edited('syllabi/french-basic-1.md', (t) => t.replace(/^level_order: .*\n/m, ''))),
    ).toMatch(/french-basic-1\.md: level and level_order/);
  });

  it("a level_order that disagrees with the README's table", () => {
    expect(
      shape(
        edited('syllabi/french-basic-1.md', (t) => t.replace('level_order: 10', 'level_order: 20')),
      ),
    ).toMatch(/french-basic-1\.md: level "Basic 1" is level_order 10/);
  });

  it("a level the README's table does not list", () => {
    expect(
      shape(
        edited('syllabi/french-basic-1.md', (t) => t.replace('level: Basic 1', 'level: Basic One')),
      ),
    ).toMatch(/french-basic-1\.md: level "Basic One" is not in the README/);
  });

  it('a date that is not YYYY-MM-DD or YYYY-MM', () => {
    expect(
      shape(
        edited('syllabi/french-basic-1.md', (t) => t.replace('2024-11-26', '26 November 2024')),
      ),
    ).toMatch(/french-basic-1\.md: source_date/);
  });

  it('document_language: en, which is left out for English', () => {
    expect(
      shape(
        edited('syllabi/french-basic-1.md', (t) =>
          t.replace('strand: General', 'strand: General\ndocument_language: en'),
        ),
      ),
    ).toMatch(/french-basic-1\.md: document_language: en/);
  });

  it('two language codes for one language', () => {
    expect(
      shape(
        edited('syllabi/french-basic-1.md', (t) =>
          t.replace('language_code: fr', 'language_code: fra'),
        ),
      ),
    ).toMatch(/\[\[French\]\] has more than one language_code/);
  });

  it('a note with two # titles, or none', () => {
    expect(shape(edited('syllabi/french-basic-1.md', (t) => `${t}\n# Again\n`))).toMatch(
      /french-basic-1\.md: 2 # titles/,
    );
    expect(shape(edited('strands/Medics.md', (t) => t.replace('# Medics', 'Medics')))).toMatch(
      /Medics\.md: 0 # titles/,
    );
  });
});

describe('checkLinks catches', () => {
  const links = (notes: readonly Note[]) => checkLinks(notes).join('\n');

  it('a [[link]] to a note that does not exist, in the body or the frontmatter', () => {
    expect(links(edited('strands/Medics.md', (t) => `${t}\n[[french-medics-advanced]]\n`))).toMatch(
      /Medics\.md: \[\[french-medics-advanced\]\] is not a note/,
    );
    expect(
      links(
        edited('syllabi/french-basic-1.md', (t) =>
          t.replace('[[french-basic-2]]', '[[french-basic-3]]'),
        ),
      ),
    ).toMatch(/french-basic-1\.md: \[\[french-basic-3\]\] is not a note/);
  });

  it('a next_level that the next note does not point back at', () => {
    expect(
      links(edited('syllabi/french-basic-2.md', (t) => t.replace(/^previous_level: .*\n/m, ''))),
    ).toMatch(/french-basic-1: next_level is french-basic-2, whose previous_level is none/);
  });

  it('a previous_level that the earlier note does not point back at', () => {
    expect(
      links(edited('syllabi/french-basic-1.md', (t) => t.replace(/^next_level: .*\n/m, ''))),
    ).toMatch(/french-basic-2: previous_level is french-basic-1, whose next_level is none/);
  });

  it('a programme_spec that does not list the syllabus back', () => {
    expect(
      links(
        edited('syllabi/french-basic-programme-spec.md', (t) =>
          t.replace('  - "[[french-basic-2]]"\n', ''),
        ),
      ),
    ).toMatch(
      /french-basic-2: programme_spec is french-basic-programme-spec, which does not list it/,
    );
  });

  it('a programme specification listing a syllabus that points elsewhere', () => {
    expect(
      links(edited('syllabi/french-basic-2.md', (t) => t.replace(/^programme_spec: .*\n/m, ''))),
    ).toMatch(/french-basic-programme-spec: lists french-basic-2, whose programme_spec is none/);
  });

  it('a one-way related link', () => {
    expect(
      links(
        edited('syllabi/french-pronunciation.md', (t) =>
          t.replace('strand: General', 'strand: General\nrelated:\n  - "[[french-basic-1]]"'),
        ),
      ),
    ).toMatch(/french-pronunciation: related to french-basic-1, which is not related back/);
  });

  it('a level chain that changes language', () => {
    expect(
      links(
        edited('syllabi/french-basic-2.md', (t) =>
          t.replace('language: "[[French]]"', 'language: "[[Spanish]]"'),
        ),
      ),
    ).toMatch(/french-basic-1: next_level french-basic-2 is in another language/);
  });

  it('a level chain whose level_order does not rise', () => {
    expect(
      links(
        edited('syllabi/french-basic-2.md', (t) =>
          t.replace('level: Basic 2\nlevel_order: 20', 'level: Basic\nlevel_order: 10'),
        ),
      ),
    ).toMatch(/french-basic-1: next_level french-basic-2 is not a higher level_order \(10 → 10\)/);
  });
});

describe('checkHubs catches', () => {
  const hubs = (notes: readonly Note[]) => checkHubs(notes).join('\n');

  it('a note its language hub does not list', () => {
    expect(
      hubs(edited('languages/French.md', (t) => t.replace(' [[french-pronunciation]] |', ''))),
    ).toMatch(/french-pronunciation\.md: not listed in \[\[French\]\]/);
  });

  it('a note its strand hub does not list', () => {
    expect(
      hubs(edited('strands/Medics.md', (t) => t.replace('[[french-medics-intermediate-1]]', ''))),
    ).toMatch(/french-medics-intermediate-1\.md: not listed in \[\[Medics\]\]/);
  });

  it('a hub the index does not list, and a missing index', () => {
    expect(
      hubs(edited('CULP Syllabi.md', (t) => t.replace('- [[Medics]]: medical students\n', ''))),
    ).toMatch(/CULP Syllabi does not list \[\[Medics\]\]/);
    expect(hubs(folder().filter((n) => n.name !== 'CULP Syllabi'))).toMatch(/no CULP Syllabi\.md/);
  });
});

describe('checkPrivacy', () => {
  const privacy = (notes: readonly Note[]) => checkPrivacy(notes).join('\n');

  it('catches an email address', () => {
    expect(
      privacy(edited('syllabi/french-basic-1.md', (t) => `${t}\nContact: a.teacher@cam.ac.uk\n`)),
    ).toMatch(/french-basic-1\.md: an email address/);
  });

  it('catches an HTML tag', () => {
    expect(
      privacy(edited('syllabi/french-basic-1.md', (t) => `${t}\n<br>\n<span class="x">y</span>\n`)),
    ).toMatch(/french-basic-1\.md: HTML <br>/);
  });

  it('passes an autolink and a bare "<" in prose', () => {
    expect(checkPrivacy(folder())).toEqual([]);
  });
});

describe('checkReadmeCounts', () => {
  const README = [
    '…converted on 2026-10-21: 6 documents in 1 languages.',
    '| `syllabi/` | 6 notes, one per document: 4 syllabi, 1 programme specifications (`x`) |',
    '| `languages/` | 1 hubs, one per language |',
    '| `strands/` | 1 hubs: Medics |',
    '| `document_date` | printed date, where it prints one (5 of 6 do not), and … |',
  ].join('\n');

  it('passes when every number matches the folder', () => {
    expect(checkReadmeCounts(folder(), README)).toEqual([]);
  });

  it('catches a number that no longer matches', () => {
    expect(
      checkReadmeCounts(folder(), README.replace('4 syllabi', '5 syllabi')).join('\n'),
    ).toMatch(/README says 5 syllabi, but there are 4/);
  });

  it('catches a statement that is no longer there', () => {
    expect(
      checkReadmeCounts(folder(), README.replace(/\| `strands\/`.*\n/, '')).join('\n'),
    ).toMatch(/README no longer says how many strand hubs/);
  });
});

describe('the CULP syllabi in docs/culp-syllabi', () => {
  const notes = loadNotes();
  const readme = readFileSync(path.join(SYLLABI_DIR, 'README.md'), 'utf8');

  it('are all read (floor: 124 documents, 26 hubs and the index)', () => {
    expect(notes.filter((n) => n.file.startsWith('syllabi/')).length).toBeGreaterThanOrEqual(124);
    expect(notes.filter((n) => !n.file.startsWith('syllabi/')).length).toBeGreaterThanOrEqual(27);
  });

  it('are each in the right shape', () => {
    expect(checkShape(notes, levelOrders(readme))).toEqual([]);
  });

  it('link only to notes that exist, both ways where they should', () => {
    expect(checkLinks(notes)).toEqual([]);
  });

  it('are each listed in their hubs, and every hub in the index', () => {
    expect(checkHubs(notes)).toEqual([]);
  });

  it('hold no email address and no HTML', () => {
    expect(checkPrivacy(notes)).toEqual([]);
  });

  it('match the numbers their README gives', () => {
    expect(checkReadmeCounts(notes, readme)).toEqual([]);
  });

  it('are the only files tracked in the folder, apart from Markdown', () => {
    expect(trackedNonMarkdown()).toEqual([]);
  });
});
