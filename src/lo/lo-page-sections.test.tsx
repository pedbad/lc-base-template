/**
 * lo-page-sections.test.tsx — the adapter: an assembled LO → the shell's
 * `PageSection[]`. This is the seam where JSON becomes DOM, so the assertions are
 * about STRUCTURE: one accordion per part, ids that don't collide, declared order
 * preserved, and the heading outline the spec fixes (h2 per section from PageLayout,
 * h3 per accordion from LoAccordion — never a skip).
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { test, expect } from 'vitest';
import { loadLo } from './load-lo-disk';
import { toPageSections } from './lo-page-sections';
import { ModalProvider } from './rich-text/modal/ModalProvider';

const lo = loadLo('lo-00-example');
const sections = toPageSections(lo);

/**
 * Render one mapped section's body, as PageLayout does — inside a ModalProvider,
 * because block prose may contain a modal link and `useModal` throws without one.
 * That throw is deliberate (a link with nothing to open is a wiring bug), so the
 * provider belongs here exactly as it does in App.
 */
const renderSection = (id: string): string =>
  renderToStaticMarkup(
    <ModalProvider modals={lo.modals}>
      {sections.find((section) => section.id === id)?.content}
    </ModalProvider>,
  );

test('toPageSections: one PageSection per declared section, in order', () => {
  expect(sections.map((section) => section.id)).toEqual(lo.sections.map((section) => section.id));
  expect(sections.map((section) => section.label)).toEqual(
    lo.sections.map((section) => section.label),
  );
});

test('toPageSections: carries navLabel through for the nav to resolve', () => {
  const grammar = sections.find((section) => section.id === 'grammar');
  expect(grammar?.navLabel).toBe('Grammar');
  expect(sections.find((section) => section.id === 'vocabulary')?.navLabel).toBeUndefined();
});

test('toPageSections: every section renders content, never the placeholder fallback', () => {
  for (const section of sections) {
    expect(section.content, `section "${section.id}" has no content`).toBeDefined();
  }
});

test('toPageSections: renders one accordion per block, with its title as the h3', () => {
  const html = renderSection('grammar');

  expect(html).toContain('<article');
  expect(html).toContain('<details');
  expect(html).toContain('<h3');
  expect(html).toContain('Placeholder grammar note');
  // Block bodies render through the block registry.
  expect(html).toContain('Placeholder grammar example sentence one');
  // ...and their prose renders as inline rich text, not as escaped literal markup:
  // authored <strong> becomes an element, and a modal link becomes a real button.
  expect(html).toContain('<strong>a key term</strong>');
  expect(html).not.toContain('&lt;strong&gt;');
  expect(html).toContain('class="modal-link"');
  expect(html).toContain('type="button"');
});

// The intro USED to be this test's `defaultOpen: true` example, until it became a
// plain block with no <details> to open. No block in the example LO sets it now, so
// the open path is covered where it belongs — LoAccordion's own test, which asserts
// `defaultOpen` renders `<details open>`. What is still worth asserting here is the
// adapter's default: a block that says nothing arrives closed.
test('toPageSections: a card block arrives closed unless its JSON opts in', () => {
  expect(renderSection('grammar')).toContain('<details');
  expect(renderSection('grammar')).not.toContain('<details open');
  expect(renderSection('vocabulary')).not.toContain('<details open');
});

test('toPageSections: accordion-level instructions render in the accordion', () => {
  expect(renderSection('grammar')).toContain('Placeholder grammar note — replace this');
});

test('toPageSections: renders one accordion per exercise, in declared order', () => {
  const html = renderSection('exercises');

  expect(html).toContain('Placeholder select exercise');
  expect(html).toContain('Placeholder multiple-choice quiz');
  expect(html.indexOf('Placeholder select exercise')).toBeLessThan(
    html.indexOf('Placeholder multiple-choice quiz'),
  );
});

test('toPageSections: accordion ids are unique across the whole page', () => {
  const html = sections.map((section) => renderSection(section.id)).join('');
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  expect(new Set(ids).size).toBe(ids.length);
});

test('toPageSections: no accordion id collides with a section anchor id', () => {
  const sectionIds = new Set(sections.map((section) => section.id));
  const html = sections.map((section) => renderSection(section.id)).join('');
  for (const [, id] of html.matchAll(/id="([^"]+)"/g)) {
    expect(
      sectionIds.has(id.replace(/-heading$/, '')),
      `accordion id "${id}" shadows a section`,
    ).toBe(false);
  }
});

test('toPageSections: heading depth inside a section never goes above h3', () => {
  const html = sections.map((section) => renderSection(section.id)).join('');
  expect(html).not.toContain('<h1');
  expect(html).not.toContain('<h2');
});

// --- plain blocks: the page talking, not an object on the page ---------------
// A `presentation: 'plain'` block is not wrapped at all. It loses the accordion's
// three jobs TOGETHER, because in this repo they are one object: the disclosure, the
// bordered surface and the <h3>. french reaches the same effect by switching a Card's
// surface off; there is no separate Card here to switch off. The example LO's intro
// is the plain block, which is why these assert against `introduction`.

test('toPageSections: a plain block renders bare — no accordion, no surface, no h3', () => {
  const html = renderSection('introduction');

  expect(html).not.toContain('<details');
  expect(html).not.toContain('<article');
  expect(html).not.toContain('<h3');
  expect(html).not.toContain('lo-accordion');
});

test('toPageSections: a plain block still renders its body and its instructions', () => {
  const html = renderSection('introduction');

  expect(html).toContain('Placeholder introduction.');
  // The accordion used to host the instructions slot; with no accordion the callout
  // has to be rendered directly, or the field would silently render nowhere.
  expect(html).toContain('class="instructions');
});

test('toPageSections: card blocks are untouched — still an accordion with its h3', () => {
  const html = renderSection('grammar');

  expect(html).toContain('<details');
  expect(html).toContain('<article');
  expect(html).toContain('<h3');
});

// Why the un-carded intro still lines up with the blocks below: one container, so
// one set of left and right edges. Losing that is what makes it look broken rather
// than deliberate.
test('toPageSections: plain and card blocks sit in the same container, so edges align', () => {
  for (const id of ['introduction', 'grammar']) {
    expect(renderSection(id)).toContain('class="space-y-3"');
  }
});
