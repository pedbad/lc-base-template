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
 * defaults. Wide: the reference's row of folder tabs, whose active one joins the
 * bordered panel beneath it. Narrow: a dropdown instead (§F3) — the vendored shadcn
 * `Select` the select exercise already ships, so its CSS is already in the main sheet.
 * Both controls are in the markup and share one `value`; a container query shows one
 * and `display: none` takes the other out of the tab order and the accessibility tree.
 * Each panel stays labelled by its tab even while the row is hidden, because
 * `aria-labelledby` resolves through hidden elements. "Wide" is a container query on
 * this block, not the viewport, because a card is narrower than a plain block.
 *
 * THE SWITCH IS `@3xl` (48rem), NOT `@xl` (36rem). At `@xl` the example's four tabs
 * wrapped, the last one falling under the other three, between 36rem and ~43rem
 * (maintainer, 2026-10-13). A fixed width is still a guess: a lesson whose tabs
 * outgrow 48rem wraps again, and the cure then is to measure the row and switch when
 * it no longer fits, with this breakpoint as the pre-hydration fallback.
 *
 * THE RULES ARE `primary`, NOT `accent`. The active tab's border is its
 * state indicator, so WCAG 1.4.11 wants 3:1 against the page. Cambridge Blue
 * (`accent`) measured 1.36:1 on the light page; `primary` measured 11.9:1 there and
 * 10.4:1 on the dark one (built-site check, 2026-10-07).
 *
 * Spec: docs/specs/2026-10-07-tabs-block-design.md §4, §5.
 */
import { useState } from 'react';
import { FOCUS_OUTLINE } from '@/components/shell/focus-outline';
import InstructionsCallout from '@/components/shell/InstructionsCallout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEntries } from '../rich-text/RichTextEntries';
import { MediaPanel } from './MediaPanel';
import { parseBlockContent } from './parse-block-content';
import { TabsBlockContentSchema } from './tabs-block-schema';

/** Hidden below @3xl, where the dropdown stands in. Wide: one row on the panel's top rule. */
const LIST_CLASSES = [
  'hidden w-full flex-row flex-wrap items-end justify-start gap-0 rounded-none p-0',
  'border-b-2 border-primary bg-transparent text-foreground group-data-horizontal/tabs:h-auto',
  '@3xl:flex',
].join(' ');

/** A folder tab; the active one joins the panel by covering the list's rule. */
const TRIGGER_CLASSES = [
  'h-auto flex-none cursor-pointer rounded-t-lg rounded-b-none border-2 border-transparent',
  'px-5 py-3',
  'text-center text-base font-normal whitespace-normal text-foreground dark:text-foreground',
  'hover:bg-card data-active:-mb-0.5 data-active:border-primary data-active:border-b-card',
  'data-active:bg-card data-active:font-semibold',
  'dark:data-active:border-primary dark:data-active:bg-card',
  'group-data-[variant=default]/tabs-list:data-active:shadow-none focus-visible:ring-0',
  FOCUS_OUTLINE,
].join(' ');

/** The narrow control: full width, a 52px touch target, ruled like the panel below. */
const SELECT_TRIGGER_CLASSES = [
  'w-full cursor-pointer border-2 border-primary bg-card px-4 py-3 data-[size=default]:h-auto',
  'text-base font-semibold text-foreground hover:bg-muted/60 dark:bg-card focus-visible:ring-0',
  FOCUS_OUTLINE,
].join(' ');

/** The panel the active tab opens onto. Wide: no top border — the list's rule is it. */
const PANEL_CLASSES = [
  'mt-2 rounded-lg border-2 border-primary bg-card p-4 text-base',
  FOCUS_OUTLINE,
  '@3xl:mt-0 @3xl:rounded-t-none @3xl:border-t-0',
].join(' ');

export function TabsBlock({ content }: { content: unknown }) {
  const { label, intro, tabs } = parseBlockContent('tabs', TabsBlockContentSchema, content);
  // Values are the tab's index: stable, because tabs are static config.
  const [value, setValue] = useState('0');

  return (
    <div className="@container space-y-4">
      {intro === undefined ? null : (
        <div className="space-y-3">
          <RichTextEntries entries={intro} paragraphClassName="text-foreground" />
        </div>
      )}
      <Tabs value={value} onValueChange={(next: string) => setValue(next)} className="gap-0">
        <div className="@3xl:hidden">
          <Select
            value={value}
            onValueChange={(next: string | null) => {
              if (next !== null) setValue(next);
            }}
          >
            <SelectTrigger aria-label={label} className={SELECT_TRIGGER_CLASSES}>
              <SelectValue>{(chosen: string) => tabs[Number(chosen)]?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab, index) => (
                <SelectItem key={tab.label} value={String(index)}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <TabsList aria-label={label} activateOnFocus className={LIST_CLASSES}>
          {tabs.map((tab, index) => (
            <TabsTrigger key={tab.label} value={String(index)} className={TRIGGER_CLASSES}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab, index) => (
          <TabsContent key={tab.label} value={String(index)} keepMounted className={PANEL_CLASSES}>
            {/* The accordions' instruction box, first in every panel. */}
            <InstructionsCallout className="mt-0 mb-3">{tab.instructions}</InstructionsCallout>
            {tab.media === undefined ? null : <MediaPanel media={tab.media} className="mb-4" />}
            <div className="space-y-3">
              <RichTextEntries entries={tab.text} paragraphClassName="text-foreground" />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
