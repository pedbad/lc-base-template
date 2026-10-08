/**
 * source-negation.test.ts — the `@source not` list in `index.css` must match reality.
 *
 * `src/index.css` tells Tailwind not to scan the vendored shadcn wrappers that nothing
 * imports. That list is a SECOND place recording which wrappers are unused, and the
 * first one — this repo's own notes — has been wrong three times (§D5's file count,
 * §D3's file count, the suite count). A list that rots here does not rot quietly: a
 * negated file that later gets imported loses its utilities silently, and the page
 * renders unstyled with a green build and a green suite.
 *
 * So both directions are checked, and they are not equally serious:
 *   - negation MISSING for an unused file  → bytes not saved. Untidy.
 *   - negation PRESENT for a USED file     → live component ships without its CSS.
 */
import { describe, expect, it } from 'vitest';
import {
  findUnusedUiModules,
  parseSourceNegations,
  readAppSources,
  readIndexCss,
  readUiModules,
  unscannedDirsFrom,
} from './source-negation';

const uiModules = readUiModules();
const sources = readAppSources();
const negated = parseSourceNegations(readIndexCss());
// Folders index.css already keeps out of the main scan (src/sandbox/, src/showcase/,
// docs/): their imports are not use. Derived from index.css itself, so the two lists
// cannot drift apart.
const unused = findUnusedUiModules({
  uiModules,
  sources,
  unscannedDirs: unscannedDirsFrom(readIndexCss()),
});

describe('the @source not list', () => {
  // THE LOAD-BEARING TEST. Equality both ways in one assertion.
  it('names exactly the ui wrappers nothing imports', () => {
    expect([...negated].sort()).toEqual([...unused].sort());
  });

  // The dangerous direction, asserted on its own so the failure message says which.
  it('never negates a wrapper that something imports', () => {
    const live = negated.filter((m) => !unused.includes(m));
    expect(live, `negated but IMPORTED — these ship without CSS: ${live.join(', ')}`).toEqual([]);
  });

  // The merely-wasteful direction.
  it('leaves no unused wrapper unnegated', () => {
    const missed = unused.filter((m) => !negated.includes(m));
    expect(missed, `unused but still scanned: ${missed.join(', ')}`).toEqual([]);
  });
});

describe('floors — a rename or a moved folder must fail loudly, not pass vacuously', () => {
  // Guard d's lesson: a collector that silently finds nothing reports green.
  it('found the ui folder and the app sources', () => {
    expect(uiModules.length).toBeGreaterThanOrEqual(15);
    expect(sources.length).toBeGreaterThanOrEqual(100);
  });

  it('found a non-empty index.css carrying the Tailwind import', () => {
    expect(readIndexCss()).toContain("@import 'tailwindcss'");
  });

  it('the live set is non-empty — every wrapper being unused would mean a broken walk', () => {
    expect(uiModules.length - unused.length).toBeGreaterThanOrEqual(5);
  });
});

describe('findUnusedUiModules', () => {
  const ui = ['button', 'sidebar', 'sheet', 'badge'];

  it('counts a module as used when app code imports it', () => {
    const sources = [
      { path: 'src/app/Page.tsx', text: "import { Button } from '@/components/ui/button';" },
    ];
    expect(findUnusedUiModules({ uiModules: ui, sources })).toEqual(['badge', 'sheet', 'sidebar']);
  });

  // TRANSITIVITY, and the reason the earlier hand count said seven instead of eleven:
  // sidebar is the only importer of sheet, so sheet dies with it.
  it('does not count an import from another DEAD wrapper as use', () => {
    const sources = [
      {
        path: 'src/components/ui/sidebar.tsx',
        text: "import { Sheet } from '@/components/ui/sheet';",
      },
    ];
    expect(findUnusedUiModules({ uiModules: ui, sources })).toEqual([
      'badge',
      'button',
      'sheet',
      'sidebar',
    ]);
  });

  it('DOES count an import from a LIVE wrapper as use', () => {
    const sources = [
      { path: 'src/app/Page.tsx', text: "import { Sidebar } from '@/components/ui/sidebar';" },
      {
        path: 'src/components/ui/sidebar.tsx',
        text: "import { Sheet } from '@/components/ui/sheet';",
      },
    ];
    expect(findUnusedUiModules({ uiModules: ui, sources })).toEqual(['badge', 'button']);
  });

  // BOTH CASES BELOW ARE REGRESSIONS THIS MODULE ACTUALLY HAD, caught on the first run
  // before it was ever green. Each silently shrank the dead set, which loses bytes
  // quietly rather than failing.

  // This very file carries import statements as fixture strings. Counting a test as a
  // user marked `sidebar` live off a fixture, and `sheet` followed it transitively.
  it('does not count a colocated test as use', () => {
    const sources = [
      { path: 'src/build/thing.test.ts', text: "import { Badge } from '@/components/ui/badge';" },
    ];
    expect(findUnusedUiModules({ uiModules: ui, sources })).toEqual([
      'badge',
      'button',
      'sheet',
      'sidebar',
    ]);
  });

  // LessonRail.tsx names `@/components/ui/sidebar` in a doc comment, explaining why §D7
  // rejected it. Read as an import, that alone would revive five wrappers.
  it('does not count a mention inside a comment as use', () => {
    const sources = [
      {
        path: 'src/components/home/LessonRail.tsx',
        text: "/* rejected: importing '@/components/ui/sidebar' cost +21.06 kB */\nexport const x = 1;",
      },
      { path: 'src/components/home/Other.tsx', text: "// import '@/components/ui/badge';" },
    ];
    expect(findUnusedUiModules({ uiModules: ui, sources })).toEqual([
      'badge',
      'button',
      'sheet',
      'sidebar',
    ]);
  });

  // A file importing itself is not a user of itself.
  it('ignores a self-import', () => {
    const sources = [
      { path: 'src/components/ui/badge.tsx', text: "import x from '@/components/ui/badge';" },
    ];
    expect(findUnusedUiModules({ uiModules: ui, sources })).toEqual([
      'badge',
      'button',
      'sheet',
      'sidebar',
    ]);
  });
});

describe('parseSourceNegations', () => {
  it('reads the module name out of each negation', () => {
    expect(
      parseSourceNegations(
        '@source not "./components/ui/badge.tsx";\n@source not "./components/ui/tabs.tsx";',
      ),
    ).toEqual(['badge', 'tabs']);
  });

  it('accepts single quotes and loose spacing', () => {
    expect(parseSourceNegations("@source   not   './components/ui/card.tsx' ;")).toEqual(['card']);
  });

  // A COMMENTED-OUT negation is not in force, so counting it would be the exact
  // staleness this file exists to catch — reported as saved bytes that never happened.
  it('ignores a negation inside a CSS comment', () => {
    expect(parseSourceNegations('/* @source not "./components/ui/badge.tsx"; */')).toEqual([]);
  });

  // A plain `@source` ADDS a path. Reading it as a negation would invert the meaning.
  it('ignores a positive @source directive', () => {
    expect(parseSourceNegations('@source "./components/ui/badge.tsx";')).toEqual([]);
  });

  it('ignores negations pointing outside the ui folder', () => {
    expect(parseSourceNegations('@source not "./lib/thing.ts";')).toEqual([]);
  });
});

describe('importers the main scan never sees', () => {
  const ui = ['badge', 'button'];
  const sources = [
    {
      path: 'src/sandbox/ImagesSection.tsx',
      text: "import { Badge } from '@/components/ui/badge';",
    },
    { path: 'src/lo/Page.tsx', text: "import { Button } from '@/components/ui/button';" },
  ];

  it('an import from a folder index.css negates is not use', () => {
    expect(
      findUnusedUiModules({ uiModules: ui, sources, unscannedDirs: ['src/sandbox/'] }),
    ).toEqual(['badge']);
  });

  it('without the narrowing the same import counts', () => {
    expect(findUnusedUiModules({ uiModules: ui, sources })).toEqual([]);
  });

  it('the folders come from index.css, files skipped', () => {
    expect(
      unscannedDirsFrom(
        '@source not "./sandbox";\n@source not "./showcase";\n@source not "../docs";\n@source not "./components/ui/badge.tsx";',
      ),
    ).toEqual(['src/sandbox/', 'src/showcase/', 'docs/']);
  });
});
