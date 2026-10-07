/**
 * tabs-block.test.tsx — the `tabs` block's content contract and its markup.
 *
 * The contract: at least two tabs, every tab labelled and told apart by its label,
 * and a name for the tab set (a plain block has no heading to name it). The markup:
 * the WAI-ARIA tabs roles, the first tab selected, and every panel present in the
 * static page so later slices keep exercise state across a switch.
 *
 * Spec: docs/specs/2026-10-07-tabs-block-design.md §3, §4.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { getBlockRenderer } from './block-renderers';
import { TabsBlockContentSchema } from './tabs-block-schema';

/** A minimal valid content object, spread-and-overridden per case. */
const valid = {
  label: 'Forms of address',
  tabs: [
    { label: 'Tu', text: ['Informal.'] },
    { label: 'Vous', text: ['Formal.'] },
  ],
};

test('two labelled tabs with text parse', () => {
  expect(TabsBlockContentSchema.safeParse(valid).success).toBe(true);
});

test('one tab is rejected — a single tab is not a choice', () => {
  const result = TabsBlockContentSchema.safeParse({ ...valid, tabs: [valid.tabs[0]] });

  expect(result.success).toBe(false);
});

test('a blank tab label and an empty tab body are both rejected', () => {
  expect(
    TabsBlockContentSchema.safeParse({
      ...valid,
      tabs: [{ label: '', text: ['x'] }, valid.tabs[1]],
    }).success,
  ).toBe(false);
  expect(
    TabsBlockContentSchema.safeParse({
      ...valid,
      tabs: [{ label: 'Tu', text: [] }, valid.tabs[1]],
    }).success,
  ).toBe(false);
});

test('two tabs with the same label are rejected, naming the second', () => {
  const result = TabsBlockContentSchema.safeParse({
    ...valid,
    tabs: [valid.tabs[0], { label: 'Tu', text: ['Again.'] }],
  });

  // Narrow before reading `.error`: safeParse returns a discriminated union.
  if (result.success) throw new Error('expected a validation failure');
  expect(result.error.issues[0]?.path).toEqual(['tabs', 1, 'label']);
});

test('the tab set needs a name, and a misspelt key fails instead of vanishing', () => {
  const { tabs } = valid;
  expect(TabsBlockContentSchema.safeParse({ tabs }).success).toBe(false);
  expect(TabsBlockContentSchema.safeParse({ ...valid, tabz: [] }).success).toBe(false);
});

test('tab text and intro arrive as parsed rich-text entries, never as strings', () => {
  const parsed = TabsBlockContentSchema.parse({
    ...valid,
    intro: ['Read <em>both</em> tabs.'],
  });

  // The no-raw-HTML contract: the renderer must receive a validated tree.
  expect(parsed.intro?.[0]?.kind).toBe('paragraph');
  expect(parsed.tabs[0]?.text[0]?.kind).toBe('paragraph');
});

/** Render the tabs body through the registry, as the adapter does. */
function renderTabs(content: unknown): string {
  const Renderer = getBlockRenderer('tabs');
  if (!Renderer) throw new Error('no renderer for "tabs"');
  return renderToStaticMarkup(<Renderer content={content} />);
}

const three = {
  label: 'Forms of address',
  intro: ['Pick a form.'],
  tabs: [
    { label: 'Tu', text: ['Informal text.'] },
    { label: 'Vous', text: ['Formal text.'] },
    { label: 'On', text: ['Impersonal text.'] },
  ],
};

/** Every opening tag in `html` that carries `role="<role>"`. */
function tagsWithRole(html: string, role: string): string[] {
  return html.match(new RegExp(`<[a-z]+[^>]*role="${role}"[^>]*>`, 'g')) ?? [];
}

test('renders one named tablist with one tab per authored tab', () => {
  const html = renderTabs(three);

  const lists = tagsWithRole(html, 'tablist');
  expect(lists).toHaveLength(1);
  expect(lists[0]).toContain('aria-label="Forms of address"');
  expect(tagsWithRole(html, 'tab')).toHaveLength(3);
});

test('the first tab is selected and only its panel is visible', () => {
  const html = renderTabs(three);

  const tabs = tagsWithRole(html, 'tab');
  expect(tabs.filter((tag) => tag.includes('aria-selected="true"'))).toHaveLength(1);
  expect(tabs[0]).toContain('aria-selected="true"');

  const panels = tagsWithRole(html, 'tabpanel');
  expect(panels).toHaveLength(3);
  expect(panels.filter((tag) => /\shidden(="")?[\s>]/.test(tag))).toHaveLength(2);
});

test('every panel is in the static page, so no content waits for a click', () => {
  const html = renderTabs(three);

  expect(html).toContain('Informal text.');
  expect(html).toContain('Formal text.');
  expect(html).toContain('Impersonal text.');
});

test('the intro renders above the tablist', () => {
  const html = renderTabs(three);

  expect(html.indexOf('Pick a form.')).toBeLessThan(html.indexOf('role="tablist"'));
});

test('content that breaks the contract fails loud, naming the type', () => {
  expect(() => renderTabs({ label: 'x', tabs: [] })).toThrow(/tabs/);
});
