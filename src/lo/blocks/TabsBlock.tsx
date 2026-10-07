/**
 * TabsBlock — `type: "tabs"`: labelled tabs, one panel showing at a time, each panel
 * the same rich text a grammar block takes.
 *
 * BUILT ON THE VENDORED shadcn `Tabs` (Base UI underneath), which supplies the
 * WAI-ARIA tabs pattern: roles, aria-selected / aria-controls, roving tabindex,
 * ←/→ and Home/End. `activateOnFocus` turns on automatic activation — panels are
 * instant, so arrowing to a tab shows it, as the french-lo-1 reference does.
 *
 * `keepMounted` keeps every panel in the DOM, `hidden` when inactive. That puts every
 * panel's text in the prerendered page, and it is what will keep a learner's answers
 * when a later slice puts an exercise in a tab and they switch away and back.
 *
 * STYLING IS OVERRIDDEN HERE, NOT IN `src/components/ui/`, which belongs to the shadcn
 * CLI (the `ThemeToggle` precedent); `cn` inside the wrapper merges these over its
 * defaults. The look follows the reference. Wide: a row of folder tabs whose active
 * one joins the bordered panel beneath it. Narrow: a stacked list with a leading bar
 * on the active tab, so every label stays visible at 320px. "Wide" is a container
 * query on this block, not the viewport, because a card is narrower than a plain block.
 *
 * Spec: docs/specs/2026-10-07-tabs-block-design.md §4, §5.
 */
import { FOCUS_OUTLINE } from '@/components/shell/focus-outline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEntries } from '../rich-text/RichTextEntries';
import { parseBlockContent } from './parse-block-content';
import { TabsBlockContentSchema } from './tabs-block-schema';

/** Narrow: a full-width column. Wide: one row sitting on the panel's top rule. */
const LIST_CLASSES = [
  'flex w-full flex-col items-stretch justify-start gap-1 rounded-none bg-transparent p-0',
  'text-foreground group-data-horizontal/tabs:h-auto',
  '@xl:flex-row @xl:flex-wrap @xl:items-end @xl:gap-0 @xl:border-b-2 @xl:border-accent',
].join(' ');

/** Narrow: a list row with a leading bar when active. Wide: a folder tab. */
const TRIGGER_CLASSES = [
  'h-auto flex-none justify-start rounded-md border-0 border-s-4 border-transparent px-4 py-2',
  'text-start text-base font-normal whitespace-normal text-foreground dark:text-foreground',
  'hover:bg-card data-active:border-accent data-active:bg-card data-active:font-semibold',
  'dark:data-active:border-accent dark:data-active:bg-card',
  'group-data-[variant=default]/tabs-list:data-active:shadow-none focus-visible:ring-0',
  FOCUS_OUTLINE,
  '@xl:rounded-none @xl:rounded-t-lg @xl:border-2 @xl:border-s-2 @xl:border-transparent',
  '@xl:px-5 @xl:py-3 @xl:text-center',
  '@xl:data-active:-mb-0.5 @xl:data-active:border-accent @xl:data-active:border-b-card',
].join(' ');

/** The panel the active tab opens onto. Wide: no top border — the list's rule is it. */
const PANEL_CLASSES = [
  'mt-2 rounded-lg border-2 border-accent bg-card p-4 text-base',
  FOCUS_OUTLINE,
  '@xl:mt-0 @xl:rounded-t-none @xl:border-t-0',
].join(' ');

export function TabsBlock({ content }: { content: unknown }) {
  const { label, intro, tabs } = parseBlockContent('tabs', TabsBlockContentSchema, content);

  return (
    <div className="@container space-y-4">
      {intro === undefined ? null : (
        <div className="space-y-3">
          <RichTextEntries entries={intro} paragraphClassName="text-foreground" />
        </div>
      )}
      {/* Values are the tab's index: stable, because tabs are static config. */}
      <Tabs defaultValue="0" className="gap-0">
        <TabsList aria-label={label} activateOnFocus className={LIST_CLASSES}>
          {tabs.map((tab, index) => (
            <TabsTrigger key={tab.label} value={String(index)} className={TRIGGER_CLASSES}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab, index) => (
          <TabsContent key={tab.label} value={String(index)} keepMounted className={PANEL_CLASSES}>
            <div className="space-y-3">
              <RichTextEntries entries={tab.text} paragraphClassName="text-foreground" />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
