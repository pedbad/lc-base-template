/**
 * semantic-dom.test.ts — guard h (buildlist 26).
 *
 * Two halves, in the order f and g established. First the deliberately-broken samples,
 * one per named §17 clause, each proved to be caught. Then — and for a guard over an
 * ALREADY-CLEAN surface this is the half that decides whether anyone leaves it switched
 * on — the false positives: the patterns this repo genuinely uses that a naive reading of
 * §17 flags. Every one of those came out of the survey (TODO §A-h) by rendering all 26
 * documents and reading them, not by guessing:
 *
 *   - a `<label for>` giving a name to a shadcn select trigger with no text of its own
 *     (17 sites across `select` and `line-match`);
 *   - `tabindex="-1"` on `main` and on every section `h2` (the skip-link target and the
 *     lesson-nav focus targets — deliberate, and not a keyboard trap);
 *   - Base UI's `aria-hidden` mirror `<input>`, which has no label BECAUSE it is hidden;
 *   - `<table>` with `sr-only` `<th>`s in `dictation`, which is real tabular data whose
 *     headers are visually redundant rather than a layout table;
 *   - a fragment that starts at `h3` (`conjugation`), correct inside an accordion;
 *   - `<p role="status">` and `<button role="combobox">`, neither of which is an ARIA
 *     role standing in for a native element it should have used.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { EXERCISE_TYPE_KEYS } from '@/config/exercise-types';
import { parseHtml } from './html-source';
import {
  auditSemanticDom,
  findHeadingViolations,
  findLandmarkViolations,
  findNameViolations,
  findReferenceViolations,
  findSemanticElementViolations,
  findShellViolations,
} from './semantic-dom';
import { renderGuardedFixtures, renderGuardedPages } from './rendered-markup';

const PAGE = { kind: 'page' } as const;
const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

/** A minimal page skeleton, so a landmark test can break one thing and only that. */
function page(main: string): string {
  return `<header><nav aria-label="Main navigation"><a href="/">Home</a></nav></header><main id="content" tabindex="-1"><h1>Title</h1>${main}</main><footer><p>©</p></footer>`;
}

describe('parseHtml — reads rendered markup well enough to judge position', () => {
  it('collects elements with their tag and attributes', () => {
    const tree = parseHtml('<section aria-labelledby="x"><h2 id="x">Hi</h2></section>');
    expect(tree.elements.map((element) => element.tag)).toEqual(['section', 'h2']);
    expect(tree.elements[0]?.attrs['aria-labelledby']).toBe('x');
  });

  // renderToString emits everything on ONE line, so a line number would always be 1.
  // The path is what actually locates a violation in a 23KB single-line document.
  it('builds a path that locates an element in the tree', () => {
    const tree = parseHtml(
      '<main><section id="grammar"><article><h3>A</h3></article></section></main>',
    );
    const heading = tree.elements.find((element) => element.tag === 'h3');
    expect(heading?.path).toBe('main > section#grammar > article > h3');
  });

  it('distinguishes repeated siblings by position', () => {
    const tree = parseHtml('<main><article><p>a</p></article><article><p>b</p></article></main>');
    expect(tree.elements.filter((element) => element.tag === 'article')[1]?.path).toBe(
      'main > article:nth-of-type(2)',
    );
  });

  it('excludes an aria-hidden subtree from visible text but keeps it in text', () => {
    const tree = parseHtml('<button><span aria-hidden="true">x</span></button>');
    const button = tree.elements[0];
    expect(button?.text.trim()).toBe('x');
    expect(button?.visibleText.trim()).toBe('');
  });

  // React writes `<!-- -->` between adjacent text nodes; reading one as an element would
  // corrupt every path after it.
  it("skips React's comment text separators", () => {
    const tree = parseHtml('<p>a<!-- -->b</p>');
    expect(tree.elements.map((element) => element.tag)).toEqual(['p']);
    expect(tree.elements[0]?.text).toBe('ab');
  });

  it('treats void and self-closed elements as childless', () => {
    const tree = parseHtml('<p><img src="a.png" alt=""/><br>tail</p>');
    expect(tree.elements.map((element) => element.tag)).toEqual(['p', 'img', 'br']);
    expect(tree.elements[0]?.text).toBe('tail');
  });

  it('decodes the entities React escapes into', () => {
    expect(parseHtml('<p>a &amp; b &lt;c&gt; &quot;d&quot;</p>').elements[0]?.text).toBe(
      'a & b <c> "d"',
    );
  });
});

describe('findHeadingViolations — the heading outline', () => {
  it('flags a skipped heading level', () => {
    const found = findHeadingViolations('<h2>A</h2><h4>B</h4>');
    expect(found).toHaveLength(1);
    expect(found[0]?.rule).toBe('skipped-heading-level');
    expect(found[0]?.detail).toContain('h4');
  });

  it('flags a second h1 on a page', () => {
    const found = findHeadingViolations(page('<h1>Again</h1>'), PAGE);
    expect(found).toHaveLength(1);
    expect(found[0]?.rule).toBe('multiple-h1');
  });

  it('flags a page with no h1 at all', () => {
    const found = findHeadingViolations('<main><h2>Only</h2></main>', PAGE);
    expect(found.map((violation) => violation.rule)).toContain('missing-h1');
  });

  // §17: "no <h4> used as a visual label" — GrammarLabel exists so this never happens.
  it('flags an h4 that appears where an h3 should', () => {
    expect(findHeadingViolations(page('<h2>S</h2><h4>Label</h4>'), PAGE)).toHaveLength(1);
  });

  it('reports which document and where, so nobody has to search', () => {
    const found = findHeadingViolations('<main><h1>A</h1><h3>B</h3></main>', {
      document: 'example.html',
      kind: 'page',
    });
    expect(found[0]?.document).toBe('example.html');
    expect(found[0]?.path).toBe('main > h3');
  });

  it('passes an unbroken h1 → h2 → h3 outline', () => {
    expect(
      findHeadingViolations(page('<section aria-label="s"><h2>A</h2><h3>B</h3></section>'), PAGE),
    ).toEqual([]);
  });

  it('passes a heading level that goes back UP by more than one', () => {
    expect(findHeadingViolations('<h1>A</h1><h2>B</h2><h3>C</h3><h2>D</h2>', PAGE)).toEqual([]);
  });

  // A fixture is a FRAGMENT: conjugation's h3 is correct inside an accordion, and
  // demanding an h1 of it would flag 24 correct documents on day one.
  it('does not demand an h1 of a fragment', () => {
    expect(findHeadingViolations('<h3>ser — presente</h3>')).toEqual([]);
  });
});

describe('findLandmarkViolations — the §17 page skeleton', () => {
  it('flags a page with no main', () => {
    const found = findLandmarkViolations('<header><nav aria-label="n">x</nav></header>', PAGE);
    expect(found.map((violation) => violation.rule)).toContain('missing-main');
  });

  it('flags a nav that is not inside the header', () => {
    const found = findLandmarkViolations(
      '<header>h</header><nav aria-label="Main">x</nav><main>m</main>',
      PAGE,
    );
    expect(found.map((violation) => violation.rule)).toContain('nav-outside-header');
  });

  it('flags a nav with no accessible name', () => {
    const found = findLandmarkViolations('<header><nav>x</nav></header><main>m</main>', PAGE);
    expect(found.map((violation) => violation.rule)).toContain('unnamed-nav');
  });

  it('flags a second primary nav', () => {
    const found = findLandmarkViolations(
      '<header><nav aria-label="A">x</nav><nav aria-label="B">y</nav></header><main>m</main>',
      PAGE,
    );
    expect(found.map((violation) => violation.rule)).toContain('multiple-nav');
  });

  it('flags a section landmark with no label', () => {
    const found = findLandmarkViolations('<main><section><h2>A</h2></section></main>', PAGE);
    expect(found.map((violation) => violation.rule)).toContain('unlabelled-section');
  });

  // §17's accordion decision: an accordion is a self-contained block, so it is an
  // <article>. A <div class="lo-accordion"> is that decision quietly reverted.
  it('flags an accordion that is not an article', () => {
    const found = findLandmarkViolations('<div class="lo-accordion rounded-lg">x</div>');
    expect(found.map((violation) => violation.rule)).toContain('accordion-not-article');
  });

  it('passes the real page skeleton', () => {
    expect(
      findLandmarkViolations(
        page(
          '<section id="s" aria-labelledby="sh"><h2 id="sh" tabindex="-1">A</h2><article class="lo-accordion" aria-labelledby="ah"><h3 id="ah">B</h3></article></section>',
        ),
        PAGE,
      ),
    ).toEqual([]);
  });

  it('holds a fragment to none of the page-scope landmark rules', () => {
    expect(findLandmarkViolations('<div class="space-y-2"><p>no landmarks here</p></div>')).toEqual(
      [],
    );
  });
});

describe('findNameViolations — accessible names on controls, aria-hidden on icons', () => {
  it('flags an icon-only button with no accessible name', () => {
    const found = findNameViolations(
      '<button type="button"><svg aria-hidden="true"></svg></button>',
    );
    expect(found).toHaveLength(1);
    expect(found[0]?.rule).toBe('unnamed-control');
  });

  it('flags a link whose only content is a decorative icon', () => {
    const found = findNameViolations('<a href="/x"><svg aria-hidden="true"></svg></a>');
    expect(found.map((violation) => violation.rule)).toContain('unnamed-control');
  });

  // The one real defect the survey found (fixed in 1ce0275): SpeakerSvg was the only
  // inline SVG in the prerendered output without aria-hidden.
  it('flags a decorative svg that is not hidden from assistive tech', () => {
    const found = findNameViolations('<button aria-label="Play"><svg><path/></svg></button>');
    expect(found).toHaveLength(1);
    expect(found[0]?.rule).toBe('exposed-icon');
  });

  it('flags a form control with no label of any kind', () => {
    const found = findNameViolations('<input type="text" id="answer"/>');
    expect(found.map((violation) => violation.rule)).toContain('unnamed-control');
  });

  it('names the document and the path it found it at', () => {
    const found = findNameViolations('<main><button type="button"></button></main>', {
      document: 'index.html',
    });
    expect(found[0]?.document).toBe('index.html');
    expect(found[0]?.path).toBe('main > button');
  });

  it('passes a button named by its visible text', () => {
    expect(findNameViolations('<button type="button">Check</button>')).toEqual([]);
  });

  it('passes a button named by aria-label with a hidden icon inside', () => {
    expect(
      findNameViolations(
        '<button type="button" aria-label="Play the audio"><svg aria-hidden="true"><path/></svg></button>',
      ),
    ).toEqual([]);
  });

  // The 17 shadcn select triggers: no text, no aria-label — named by an sr-only
  // <label for>, which is legal because <button> is a labelable element.
  it('passes a control named by an associated sr-only label', () => {
    expect(
      findNameViolations(
        '<span><label class="sr-only" for="blank-0">Answer for blank 1</label><button type="button" id="blank-0" role="combobox" data-placeholder=""></button></span>',
      ),
    ).toEqual([]);
  });

  it('passes a text input named by a label for it', () => {
    expect(
      findNameViolations('<p><label for="a">Answer</label><input type="text" id="a"/></p>'),
    ).toEqual([]);
  });

  // Base UI renders a visually-hidden mirror input so a styled select submits with a
  // form. It has no label BECAUSE it is aria-hidden, and demanding one is nonsense.
  it('passes an aria-hidden mirror input with no label', () => {
    expect(
      findNameViolations('<input id="base-ui-x-hidden-input" tabindex="-1" aria-hidden="true"/>'),
    ).toEqual([]);
  });

  it('passes a decorative image that is correctly alt="" and aria-hidden', () => {
    expect(findNameViolations('<img src="a.png" alt="" aria-hidden="true"/>')).toEqual([]);
  });

  it('passes an svg that carries a name of its own rather than hiding', () => {
    expect(findNameViolations('<svg role="img" aria-label="Score chart"><path/></svg>')).toEqual(
      [],
    );
  });

  it('passes a hidden input, which has no accessible name to give', () => {
    expect(findNameViolations('<input type="hidden" value="x"/>')).toEqual([]);
  });
});

describe('findReferenceViolations — every id reference resolves, every id is unique', () => {
  it('flags an aria-controls pointing at no id', () => {
    const found = findReferenceViolations('<button aria-controls="nav-panel">Lessons</button>');
    expect(found).toHaveLength(1);
    expect(found[0]?.rule).toBe('dangling-reference');
    expect(found[0]?.detail).toContain('nav-panel');
  });

  it('flags a dangling aria-labelledby', () => {
    const found = findReferenceViolations('<section aria-labelledby="gone"><h2>A</h2></section>');
    expect(found.map((violation) => violation.rule)).toEqual(['dangling-reference']);
  });

  it('flags a label pointing at no control', () => {
    expect(findReferenceViolations('<label for="nothing">Answer</label>')).toHaveLength(1);
  });

  it('flags a duplicate id', () => {
    const found = findReferenceViolations('<p id="x">a</p><p id="x">b</p>');
    expect(found.map((violation) => violation.rule)).toContain('duplicate-id');
    expect(found[0]?.detail).toContain('x');
  });

  it('passes the nav toggle wiring, where the panel is defined once', () => {
    expect(
      findReferenceViolations(
        '<button aria-expanded="false" aria-controls="lesson-nav-panel">Lessons</button><div id="lesson-nav-panel">nav</div>',
      ),
    ).toEqual([]);
  });

  it('passes a multi-token aria-labelledby where every token resolves', () => {
    expect(
      findReferenceViolations('<div aria-labelledby="a b"><p id="a">A</p><p id="b">B</p></div>'),
    ).toEqual([]);
  });
});

describe('findSemanticElementViolations — the right element for the job', () => {
  it('flags a table with no headers, which is a layout table', () => {
    const found = findSemanticElementViolations('<table><tr><td>a</td><td>b</td></tr></table>');
    expect(found).toHaveLength(1);
    expect(found[0]?.rule).toBe('layout-table');
  });

  it('flags a table explicitly marked presentational', () => {
    const found = findSemanticElementViolations(
      '<table role="presentation"><tr><th>a</th></tr></table>',
    );
    expect(found.map((violation) => violation.rule)).toContain('layout-table');
  });

  it('flags <b> and <i> used for emphasis', () => {
    const found = findSemanticElementViolations('<p>a <b>bold</b> and <i>italic</i></p>');
    expect(found).toHaveLength(2);
    expect(found[0]?.rule).toBe('presentational-emphasis');
  });

  it('flags an interactive ARIA role on an element that cannot take focus', () => {
    const found = findSemanticElementViolations('<div role="button" aria-label="Close">x</div>');
    expect(found.map((violation) => violation.rule)).toContain('unfocusable-role');
  });

  it('flags an interactive ARIA role with no accessible name', () => {
    const found = findSemanticElementViolations('<span role="switch" tabindex="0"></span>');
    expect(found.map((violation) => violation.rule)).toContain('unnamed-role');
  });

  it('passes real tabular data, even when its headers are sr-only', () => {
    expect(
      findSemanticElementViolations(
        '<table><thead><tr><th class="sr-only">Audio</th><th class="sr-only">Answer</th></tr></thead><tbody><tr><td>a</td><td>b</td></tr></tbody></table>',
      ),
    ).toEqual([]);
  });

  it('passes <strong> and <em>', () => {
    expect(findSemanticElementViolations('<p><strong>a</strong> <em>b</em></p>')).toEqual([]);
  });

  // A live region is not an interactive role standing in for a native element, and the
  // repo has 16 of these result slots. `jsx-a11y/prefer-tag-over-role` would rewrite
  // every one of them to <output> for no assistive-tech gain — see the module header.
  it('passes <p role="status">, the result slot every engine uses', () => {
    expect(findSemanticElementViolations('<p role="status">Correct</p>')).toEqual([]);
  });

  it('passes an interactive role on a NATIVE interactive element', () => {
    expect(
      findSemanticElementViolations(
        '<button type="button" role="combobox" aria-expanded="false" aria-label="Answer">x</button>',
      ),
    ).toEqual([]);
  });

  it('passes the shadcn switch: a span with a role, focus and a name', () => {
    expect(
      findSemanticElementViolations(
        '<span role="switch" tabindex="0" aria-checked="false" aria-label="Dark mode"></span>',
      ),
    ).toEqual([]);
  });
});

describe('findShellViolations — the one §17 clause that lives in the source template', () => {
  it('flags a document with no lang', () => {
    const found = findShellViolations('<!doctype html><html><head></head><body></body></html>');
    expect(found.map((violation) => violation.rule)).toContain('missing-lang');
  });

  it('flags an empty lang', () => {
    expect(findShellViolations('<html lang=""></html>')).toHaveLength(1);
  });

  it('passes the repo template', () => {
    expect(
      findShellViolations(readFileSync(path.join(REPO_ROOT, 'index.html'), 'utf-8'), {
        document: 'index.html',
      }),
    ).toEqual([]);
  });
});

describe('the rendered surface obeys §17', () => {
  const pages = renderGuardedPages();
  const fixtures = renderGuardedFixtures();

  // Guard d's lesson: a guard that collects by name switches itself off the moment a
  // file or field is renamed. Every floor below is a thing a rename would empty.
  it('validated the landing page and every LO page', () => {
    expect(pages.length).toBeGreaterThanOrEqual(2);
    expect(pages.map((rendered) => rendered.document)).toContain('index.html');
    expect(pages.every((rendered) => rendered.html.length > 1000)).toBe(true);
  });

  it('validated a fixture for all 15 engines, not the 2 a default build prerenders', () => {
    const types = new Set(fixtures.map((rendered) => rendered.engine));
    expect(types.size).toBe(EXERCISE_TYPE_KEYS.length);
    expect([...types].sort()).toEqual([...EXERCISE_TYPE_KEYS].sort());
    expect(fixtures.length).toBeGreaterThanOrEqual(24);
  });

  it.each(pages.map((rendered) => [rendered.document, rendered] as const))(
    '%s obeys the §17 contract',
    (_name, rendered) => {
      const audit = auditSemanticDom(rendered.html, { document: rendered.document, kind: 'page' });
      expect(audit.violations).toEqual([]);
      expect(audit.headings).toBeGreaterThanOrEqual(3);
      expect(audit.landmarks).toBeGreaterThanOrEqual(4);
    },
  );

  it.each(fixtures.map((rendered) => [rendered.document, rendered] as const))(
    '%s obeys the §17 contract',
    (_name, rendered) => {
      const audit = auditSemanticDom(rendered.html, {
        document: rendered.document,
        kind: 'fragment',
      });
      expect(audit.violations).toEqual([]);
      expect(audit.elements).toBeGreaterThan(5);
    },
  );

  it('saw a plausible amount of markup, so a moved fixture cannot empty the sweep', () => {
    const audits = [...pages, ...fixtures].map((rendered) =>
      auditSemanticDom(rendered.html, {
        document: rendered.document,
        kind: rendered.kind,
      }),
    );
    const total = (pick: (audit: (typeof audits)[number]) => number): number =>
      audits.reduce((sum, audit) => sum + pick(audit), 0);

    expect(total((audit) => audit.controls)).toBeGreaterThanOrEqual(150);
    expect(total((audit) => audit.icons)).toBeGreaterThanOrEqual(70);
    expect(total((audit) => audit.ids)).toBeGreaterThanOrEqual(80);
    // 14, not 15: the example LO's introduction became a `presentation: 'plain'`
    // block, which renders with no accordion and therefore no <h3>. This floor is a
    // smoke test against a moved fixture silently emptying the sweep, so it tracks a
    // deliberate DOM change rather than pinning an exact count.
    expect(total((audit) => audit.headings)).toBeGreaterThanOrEqual(14);
  });
});
