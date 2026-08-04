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

test('toPageSections: a block accordion opens by default only when the JSON says so', () => {
  expect(renderSection('introduction')).toContain('<details open');
  expect(renderSection('grammar')).not.toContain('<details open');
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
