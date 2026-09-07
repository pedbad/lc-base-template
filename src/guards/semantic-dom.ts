/**
 * semantic-dom.ts — guard h: the rendered DOM obeys the §17 semantic contract
 * (buildlist 26, spec §17, §24, §95).
 *
 * HALF OF GUARD h WAS ALREADY LIVE BEFORE THIS FILE EXISTED, and this is the other half.
 * `eslint-plugin-jsx-a11y` is wired into `eslint.config.js` and has been failing CI on
 * bad JSX since the lint config was written — missing `alt`, unreachable click handlers,
 * invalid ARIA, an interactive role with no focus. What it cannot see is what those
 * components COMPOSE INTO: `jsx-a11y` lints one JSX file at a time, and every clause of
 * §17 that this file checks is a property of the whole assembled page. No lint rule can
 * know that `LoAccordion` renders inside a `section` that `LoPage` labelled, that the
 * `h2` above it came from a section title and the `h3` inside it from a block title, or
 * that the `aria-controls` on the nav toggle resolves to a panel rendered by a different
 * component. Guard h reads the finished document, where those questions have answers.
 *
 * WHAT THIS GUARDS. Nothing today — the third guard in a row for which that is true, and
 * for the same reason (TODO §A-h). All 26 documents were rendered and read during the
 * survey: both pages match the §17 skeleton exactly, all 15 engines are clean, and the
 * one real defect found (`SpeakerSvg` with no `aria-hidden`) was fixed in `1ce0275`
 * before this guard existed. So its value is the same as f's and g's: the FIRST author
 * who writes an `<h4>` as a visual label, or a `<div class="lo-accordion">`, or an
 * icon-only button with no name, finds out from a test instead of from a screen-reader
 * user.
 *
 * WHICH INVERTS THE DIFFICULTY, again. On a clean surface the hard part is not catching
 * violations — it is NOT FLAGGING CORRECT CODE, and §17 read naively flags a great deal
 * of it. Every narrowing below is a pattern the repo genuinely uses that a first-guess
 * rule reports:
 *
 *   - A CONTROL CAN BE NAMED BY A `<label for>`, and 17 of them are. shadcn's select
 *     trigger renders a `<button>` with a placeholder and no text; `SelectExercise` and
 *     `LineMatchExercise` give it an `sr-only` `<label for>`, which is legal because
 *     `<button>` is a labelable element. A name rule that only knows `aria-label` and
 *     text content flags every blank in the repo.
 *   - AN `aria-hidden` CONTROL NEEDS NO NAME. Base UI renders a visually-hidden mirror
 *     `<input>` per select so the styled control still submits with a form. It is
 *     `aria-hidden` and `tabindex="-1"` — invisible to the accessibility tree, so
 *     demanding a label is asking for a name nothing will ever read. Five of these.
 *   - A `<table>` IS JUDGED BY ITS HEADERS, NOT ITS LOOKS. `dictation` renders a table
 *     whose two `<th>`s are `sr-only`, which reads as a layout table to the eye and is
 *     the opposite: real tabular data whose headers are visually redundant but needed by
 *     a screen reader. §17 bans `<table>` for LAYOUT, so the check is "has a `<th>` or a
 *     `<caption>`, and is not `role="presentation"`" — which passes both real tables in
 *     the repo (`dictation`, `typed-transform`) and fails a `<tr><td>`-only grid.
 *   - `tabindex="-1"` IS NOT A DEFECT HERE. It is on `main` (the skip-link target) and on
 *     all four section `h2`s (the lesson-nav focus targets) — deliberate, and the correct
 *     way to make a non-interactive element programmatically focusable. Nothing below
 *     reads `tabindex="-1"` as a problem.
 *   - A FRAGMENT IS NOT A PAGE. This is what decision 3 costs: 24 of the 26 documents are
 *     single engines, which have no `h1`, no landmarks and no `main`. `conjugation`
 *     legitimately opens at `h3`. So the page-scope rules — one `h1`, one
 *     `header > nav[aria-label]`, `main` present, `section` labelled — apply only when
 *     `kind: 'page'`, and the rules that hold for any subtree apply to both.
 *
 * NATIVE-FIRST IS DELIBERATELY NARROWED TO WHAT RENDERED OUTPUT CAN DECIDE. §17 asks for
 * "native interactive elements first, before ARIA role fallbacks". The obvious home for
 * that is lint, and there IS a rule for it — `jsx-a11y/prefer-tag-over-role` — which is
 * NOT in `flatConfigs.recommended`, so it is currently off. It was tried and rejected
 * rather than assumed: it fires 16 times in this repo and every single hit is
 * `<p role="status">`, the result slot every engine renders, which it wants rewritten as
 * `<output>`. That swap changes nothing an assistive technology does (`<output>` simply
 * HAS `role="status"`), and a live region is not an ARIA role standing in for a native
 * element it should have used. Turning it on would buy a 16-file rewrite and no signal.
 * What is left is the half that IS a real defect and IS visible in the output: an
 * interactive role on an element that cannot take focus, or that has no accessible name.
 * The shadcn switch — `<span role="switch" tabindex="0" aria-label="Dark mode">` — passes
 * both, as generated code must (guard f's `src/components/ui/` precedent).
 *
 * MECHANISM — NO jsdom, NO NEW DEPENDENCY, both decided against the obvious answer
 * (TODO §A-h decisions 1 and 2):
 *
 *   - NOT axe-core, because it needs a DOM. `docs/TOOLING.md` records the deliberate
 *     choice of `environment: 'node'` — the suite renders to strings — and adding jsdom
 *     to host a11y rules would reverse it for the whole suite. A string is all a checker
 *     of §17 needs. axe's WCAG rule coverage stays available as a separate later
 *     decision, not a side effect of this one.
 *   - NOT `html-validate` either, and this reverses the survey's first answer. There is
 *     ZERO `dangerouslySetInnerHTML` in the repo — all four grep hits are comments saying
 *     so, and `RichText.tsx` parses authored rich text into real React nodes — so every
 *     byte of markup is React-emitted, and React cannot produce the malformed-markup
 *     class a W3C validator exists to catch: no unclosed tags, no invalid nesting, no
 *     unescaped text. The "w3c" half of "w3c + a11y" is guaranteed by construction. What
 *     React CAN still emit is bad SEMANTICS, which is exactly §17, and no off-the-shelf
 *     ruleset expresses "one `<article>` per accordion" or "`section` count == `h2`
 *     count" — those are this repo's contract, not the web's.
 *
 * IT NEEDS NO `dist/`, WHICH IS WHY IT PASSES ON A CLEAN CHECKOUT. Guard h is the only
 * guard whose subject is a built artefact, so the obvious implementation reads
 * `dist/index.html` and `dist/example.html` — and then a fresh clone has no `dist/` and
 * the guard either fails for the wrong reason or, far worse, skips. `rendered-markup.tsx`
 * renders the same component trees the prerender pass renders, in process, from source.
 * That is not an approximation: the body it produces is BYTE-IDENTICAL to the one
 * `scripts/prerender.tsx` writes into `dist/`, verified during the survey. Reading `dist/`
 * would be strictly worse than this even when it exists, because a stale `dist/` would
 * validate last week's markup and pass. The only thing `dist/` adds is the `<head>` Vite
 * assembled, which holds no §17 surface — `<html lang>` lives in the source `index.html`
 * and is checked there.
 */
import { collapse, parseHtml, type HtmlElement, type HtmlTree } from './html-source';

/** A page is the whole document; a fragment is one engine, rendered in isolation. */
export type DocumentKind = 'page' | 'fragment';

/** How to read one document. Defaults suit an inline sample in a test. */
export interface DomOptions {
  /** The page or fixture this markup came from, named in every violation. */
  readonly document?: string;
  readonly kind?: DocumentKind;
}

/**
 * One §17 violation, located well enough to fix without searching. There is no `line` —
 * see `html-source.ts` on why `path` replaces it for single-line rendered output.
 */
export interface DomViolation {
  readonly document: string;
  /** Which rule fired, e.g. `skipped-heading-level`, `unnamed-control`. */
  readonly rule: string;
  /** Where in the tree, e.g. `main > section#exercises > article > button`. */
  readonly path: string;
  /** What is wrong, in a sentence an author can act on. */
  readonly detail: string;
}

/** Elements that are interactive without help, so an ARIA role on them is not a stand-in. */
const NATIVE_INTERACTIVE = new Set(['a', 'button', 'input', 'select', 'textarea', 'summary']);

/** Elements that can be given an accessible name by a `<label for>`. */
const LABELABLE = new Set(['button', 'input', 'select', 'textarea', 'meter', 'progress', 'output']);

/** ARIA roles that stand in for a native interactive element, so they must work like one. */
const INTERACTIVE_ROLES = new Set([
  'button',
  'checkbox',
  'combobox',
  'link',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'radio',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'textbox',
]);

/** `<input>` types with nothing for a label to name. */
const UNNAMEABLE_INPUT_TYPES = new Set(['hidden', 'submit', 'reset', 'button', 'image']);

/** Roles that declare a `<table>` presentational — i.e. layout, which §17 bans. */
const PRESENTATION_ROLES = new Set(['presentation', 'none']);

/** The class `LoAccordion` renders on its wrapper; §17 requires that wrapper be an article. */
const ACCORDION_CLASS = 'lo-accordion';

/** Landmark elements, counted so a floor can assert the sweep saw a real page. */
const LANDMARKS = new Set(['header', 'nav', 'main', 'footer', 'aside', 'section', 'article']);

function classesOf(element: HtmlElement): readonly string[] {
  return (element.attrs.class ?? '').split(/\s+/).filter((name) => name !== '');
}

function headingLevel(element: HtmlElement): number | null {
  const match = /^h([1-6])$/.exec(element.tag);
  return match ? Number(match[1]) : null;
}

function violation(
  document: string,
  rule: string,
  element: Pick<HtmlElement, 'path'>,
  detail: string,
): DomViolation {
  return { document, rule, path: element.path, detail };
}

function read(
  html: string,
  options: DomOptions,
): { tree: HtmlTree; document: string; kind: DocumentKind } {
  return {
    tree: parseHtml(html),
    document: options.document ?? '<inline>',
    kind: options.kind ?? 'fragment',
  };
}

/**
 * The heading outline: one `h1` per page, and no level ever skipped.
 *
 * A level may jump back UP by any amount — closing an `h3` and opening the next `h2` is
 * how sections end — but may only go DOWN one at a time. The `h1` rules are page-scope:
 * a fragment has no `h1` and must not be asked for one.
 */
export function findHeadingViolations(html: string, options: DomOptions = {}): DomViolation[] {
  const { tree, document, kind } = read(html, options);
  const found: DomViolation[] = [];
  const headings = tree.elements
    .map((element) => ({ element, level: headingLevel(element) }))
    .filter((entry): entry is { element: HtmlElement; level: number } => entry.level !== null);

  if (kind === 'page') {
    const h1s = headings.filter((entry) => entry.level === 1);
    if (h1s.length === 0) {
      found.push(
        violation(document, 'missing-h1', { path: '' }, 'page has no <h1>; §17 requires one'),
      );
    }
    for (const extra of h1s.slice(1)) {
      found.push(
        violation(
          document,
          'multiple-h1',
          extra.element,
          `second <h1> ("${collapse(extra.element.text).slice(0, 40)}"); §17 allows one per page`,
        ),
      );
    }
  }

  let previous: number | null = null;
  for (const { element, level } of headings) {
    if (previous !== null && level > previous + 1) {
      found.push(
        violation(
          document,
          'skipped-heading-level',
          element,
          `<${element.tag}> follows <h${previous}>, skipping h${previous + 1} — use GrammarLabel for a visual label`,
        ),
      );
    }
    previous = level;
  }

  return found;
}

/**
 * The §17 page skeleton: `header > nav[aria-label]` → `main` → labelled `section`s, with
 * one `<article>` per accordion.
 *
 * All but the accordion rule are page-scope. The accordion rule holds for any subtree,
 * because an accordion is an accordion wherever it is rendered.
 */
export function findLandmarkViolations(html: string, options: DomOptions = {}): DomViolation[] {
  const { tree, document, kind } = read(html, options);
  const found: DomViolation[] = [];

  for (const element of tree.elements) {
    if (classesOf(element).includes(ACCORDION_CLASS) && element.tag !== 'article') {
      found.push(
        violation(
          document,
          'accordion-not-article',
          element,
          `<${element.tag}> carries .${ACCORDION_CLASS}; §17 requires one <article> per accordion`,
        ),
      );
    }
  }

  if (kind !== 'page') return found;

  const navs = tree.elements.filter((element) => element.tag === 'nav');
  if (tree.elements.every((element) => element.tag !== 'main')) {
    found.push(violation(document, 'missing-main', { path: '' }, 'page has no <main> landmark'));
  }
  if (navs.length === 0) {
    found.push(
      violation(
        document,
        'missing-nav',
        { path: '' },
        'page has no <nav> landmark in its <header>',
      ),
    );
  }
  for (const extra of navs.slice(1)) {
    found.push(
      violation(document, 'multiple-nav', extra, '§17 allows exactly one primary nav landmark'),
    );
  }
  for (const nav of navs) {
    if (!nav.ancestors.includes('header')) {
      found.push(
        violation(document, 'nav-outside-header', nav, '§17 puts the primary nav inside <header>'),
      );
    }
    if ((nav.attrs['aria-label'] ?? '') === '' && (nav.attrs['aria-labelledby'] ?? '') === '') {
      found.push(
        violation(document, 'unnamed-nav', nav, '<nav> needs an aria-label to name the landmark'),
      );
    }
  }
  for (const section of tree.elements.filter((element) => element.tag === 'section')) {
    if (
      (section.attrs['aria-labelledby'] ?? '') === '' &&
      (section.attrs['aria-label'] ?? '') === ''
    ) {
      found.push(
        violation(
          document,
          'unlabelled-section',
          section,
          '<section> is only a landmark once named — add aria-labelledby pointing at its <h2>',
        ),
      );
    }
  }

  return found;
}

/** Every `for=` target in the document, so a labelable control can find its label. */
function labelledIds(tree: HtmlTree): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const element of tree.elements) {
    if (element.tag !== 'label') continue;
    const target = element.attrs.for;
    if (target !== undefined && target !== '') ids.add(target);
  }
  return ids;
}

/** Whether an element carries a name from ARIA or from a title attribute. */
function hasDeclaredName(element: HtmlElement): boolean {
  return (
    (element.attrs['aria-label'] ?? '').trim() !== '' ||
    (element.attrs['aria-labelledby'] ?? '').trim() !== '' ||
    (element.attrs.title ?? '').trim() !== ''
  );
}

/**
 * Accessible names on controls, and `aria-hidden` on decorative icons — the two halves of
 * §17's icon clause, and between them the defect class this guard was written for.
 *
 * An `aria-hidden` element is skipped throughout: it is not in the accessibility tree, so
 * it has no name to be missing. That is what lets Base UI's mirror inputs through.
 */
export function findNameViolations(html: string, options: DomOptions = {}): DomViolation[] {
  const { tree, document } = read(html, options);
  const found: DomViolation[] = [];
  const labelled = labelledIds(tree);

  for (const element of tree.elements) {
    if (element.hidden) continue;

    if (element.tag === 'svg') {
      const named = hasDeclaredName(element) || element.attrs.role === 'img';
      if (!named) {
        found.push(
          violation(
            document,
            'exposed-icon',
            element,
            'decorative <svg> is read by assistive tech — add aria-hidden="true", or name it with role="img" + aria-label',
          ),
        );
      }
      continue;
    }

    const isControl =
      element.tag === 'button' ||
      element.tag === 'textarea' ||
      element.tag === 'select' ||
      (element.tag === 'a' && (element.attrs.href ?? '') !== '') ||
      (element.tag === 'input' && !UNNAMEABLE_INPUT_TYPES.has(element.attrs.type ?? 'text'));
    if (!isControl) continue;

    const id = element.attrs.id ?? '';
    const named =
      hasDeclaredName(element) ||
      collapse(element.visibleText) !== '' ||
      (element.attrs.alt ?? '').trim() !== '' ||
      (LABELABLE.has(element.tag) && id !== '' && labelled.has(id)) ||
      element.ancestors.includes('label');
    if (!named) {
      found.push(
        violation(
          document,
          'unnamed-control',
          element,
          `<${element.tag}> has no accessible name — give it visible text, an aria-label, or a <label for="…">`,
        ),
      );
    }
  }

  return found;
}

/** Split an ID-reference attribute, which may name several ids. */
function tokens(value: string | undefined): readonly string[] {
  return (value ?? '').split(/\s+/).filter((token) => token !== '');
}

/**
 * Every id reference resolves, and no id is used twice.
 *
 * A dangling `aria-controls` is the classic sliding-nav failure — the toggle announces a
 * panel that is not there — and a duplicate id silently redirects every reference to
 * whichever came first.
 */
export function findReferenceViolations(html: string, options: DomOptions = {}): DomViolation[] {
  const { tree, document } = read(html, options);
  const found: DomViolation[] = [];
  const seen = new Set<string>();

  for (const element of tree.elements) {
    const id = element.attrs.id;
    if (id === undefined || id === '') continue;
    if (seen.has(id)) {
      found.push(
        violation(document, 'duplicate-id', element, `id "${id}" is already used in this document`),
      );
    }
    seen.add(id);
  }

  for (const element of tree.elements) {
    const references = [
      ...tokens(element.attrs['aria-labelledby']).map((id) => ['aria-labelledby', id] as const),
      ...tokens(element.attrs['aria-describedby']).map((id) => ['aria-describedby', id] as const),
      ...tokens(element.attrs['aria-controls']).map((id) => ['aria-controls', id] as const),
      ...(element.tag === 'label'
        ? tokens(element.attrs.for).map((id) => ['for', id] as const)
        : []),
    ];
    for (const [attribute, id] of references) {
      if (seen.has(id)) continue;
      found.push(
        violation(
          document,
          'dangling-reference',
          element,
          `${attribute}="${id}" resolves to no element in this document`,
        ),
      );
    }
  }

  return found;
}

/**
 * The right element for the job: no `<table>` for layout, `<strong>`/`<em>` over
 * `<b>`/`<i>`, and an interactive ARIA role only where it actually behaves like one.
 */
export function findSemanticElementViolations(
  html: string,
  options: DomOptions = {},
): DomViolation[] {
  const { tree, document } = read(html, options);
  const found: DomViolation[] = [];

  for (const element of tree.elements) {
    if (element.tag === 'b' || element.tag === 'i') {
      found.push(
        violation(
          document,
          'presentational-emphasis',
          element,
          `<${element.tag}> carries no meaning — use <${element.tag === 'b' ? 'strong' : 'em'}>`,
        ),
      );
      continue;
    }

    if (element.tag === 'table') {
      const role = element.attrs.role ?? '';
      const descendants = tree.elements.filter((other) =>
        other.path.startsWith(`${element.path} > `),
      );
      const hasHeaders = descendants.some((other) => other.tag === 'th' || other.tag === 'caption');
      if (PRESENTATION_ROLES.has(role) || !hasHeaders) {
        found.push(
          violation(
            document,
            'layout-table',
            element,
            PRESENTATION_ROLES.has(role)
              ? `<table role="${role}"> is a layout table — §17 allows <table> only for tabular data`
              : '<table> has no <th> or <caption>, so it reads as layout — use flex/grid, or add headers',
          ),
        );
      }
      continue;
    }

    const role = element.attrs.role ?? '';
    if (!INTERACTIVE_ROLES.has(role) || NATIVE_INTERACTIVE.has(element.tag)) continue;
    if (element.hidden) continue;
    if ((element.attrs.tabindex ?? '') === '') {
      found.push(
        violation(
          document,
          'unfocusable-role',
          element,
          `<${element.tag} role="${role}"> cannot be reached by keyboard — use a native <button>/<a>, or add tabindex`,
        ),
      );
    }
    if (!hasDeclaredName(element) && collapse(element.visibleText) === '') {
      found.push(
        violation(
          document,
          'unnamed-role',
          element,
          `<${element.tag} role="${role}"> has no accessible name`,
        ),
      );
    }
  }

  return found;
}

/**
 * The one §17 clause that is NOT in the rendered body: the document's declared language.
 *
 * `renderToString` returns `<body>` markup, so `<html lang>` never appears in anything
 * the sweep renders — it comes from the source `index.html`, which Vite copies through
 * into every built page. WCAG 3.1.1 turns on it: without a `lang`, a screen reader
 * pronounces the whole page in the reader's default voice, which for a LANGUAGE COURSE
 * is the difference between Spanish read as Spanish and Spanish read as English. This is
 * why the guard reads the source template as well as the rendered bodies, and why it
 * still needs no `dist/`.
 */
export function findShellViolations(html: string, options: DomOptions = {}): DomViolation[] {
  const document = options.document ?? '<inline>';
  const lang = /<html\b[^>]*\slang="([^"]*)"/i.exec(html)?.[1] ?? '';
  if (lang.trim() !== '') return [];
  return [
    {
      document,
      rule: 'missing-lang',
      path: 'html',
      detail:
        '<html> has no lang attribute — assistive tech cannot pick a pronunciation (WCAG 3.1.1)',
    },
  ];
}

/** Every §17 violation in one document, plus the totals a staleness floor can assert on. */
export interface SemanticDomAudit {
  readonly violations: readonly DomViolation[];
  /** Elements read — the thing an empty or renamed document would zero. */
  readonly elements: number;
  /** `h1`–`h6` found. */
  readonly headings: number;
  /** Landmark and sectioning elements found. */
  readonly landmarks: number;
  /** Controls found: buttons, links, form fields. */
  readonly controls: number;
  /** `<svg>` elements found, hidden or named. */
  readonly icons: number;
  /** `id` attributes found. */
  readonly ids: number;
}

/** Run every §17 rule over one rendered document. */
export function auditSemanticDom(html: string, options: DomOptions = {}): SemanticDomAudit {
  const { tree } = read(html, options);
  const count = (predicate: (element: HtmlElement) => boolean): number =>
    tree.elements.filter(predicate).length;

  return {
    violations: [
      ...findHeadingViolations(html, options),
      ...findLandmarkViolations(html, options),
      ...findNameViolations(html, options),
      ...findReferenceViolations(html, options),
      ...findSemanticElementViolations(html, options),
    ],
    elements: tree.elements.length,
    headings: count((element) => headingLevel(element) !== null),
    landmarks: count((element) => LANDMARKS.has(element.tag)),
    controls: count(
      (element) =>
        element.tag === 'button' ||
        element.tag === 'input' ||
        element.tag === 'select' ||
        element.tag === 'textarea' ||
        (element.tag === 'a' && (element.attrs.href ?? '') !== ''),
    ),
    icons: count((element) => element.tag === 'svg'),
    ids: count((element) => (element.attrs.id ?? '') !== ''),
  };
}
