/**
 * OutcomesBlock — `type: "outcomes"`. The lead-in, a ticked list of what a learner
 * will be able to do, and an optional illustration beside them.
 *
 * AN INFO CALLOUT (maintainer, 2026-10-13). french-lo-1 puts its outcomes in its info
 * box; `Callout` is this template's twin of it, so the outcomes reuse it rather than
 * restyle a card: same tint, border, icon and `role="note"` as every instructions box.
 * The lead is its title. Lead and list are body size in full ink, overriding the
 * callout's `text-sm` and muted description on the children, so `Callout` is untouched.
 *
 * 5:7 AT `lg`, STACKED BELOW IT; ONE COLUMN WHEN THERE IS NO IMAGE. The image takes the
 * wider track and the card the narrower (maintainer, 2026-10-13: art leads, the list
 * is short); 768 is too narrow for two columns carrying artwork. Tracks are `minmax(0,Nfr)` rather than a bare `fr` because a long
 * unbroken word in an outcome blows out an `fr` track and takes the page into
 * horizontal overflow with it. Without an image the card holds the reading measure
 * instead of sitting in a 5/12 track beside a gap.
 *
 * NO STYLESHEET AND NO TOKEN. `VocabularyBlock` is the precedent: a block renderer
 * lays itself out with utilities. That keeps this out of guard f (raw `px`) and guard
 * g (layer discipline) by authoring no CSS rule at all, and out of
 * `token-presets.test.ts`, which enforces preset parity in both directions over every
 * token.
 *
 * THE TICK IS DECORATION. List semantics come from <ul>/<li>, so every icon takes
 * `aria-hidden` — a tick read aloud before each item says nothing the list has not
 * already said.
 *
 * THE IMAGE FRAME MATCHES THE CARD: the callout's `rounded-lg`, a border and a faint
 * shadow, so the two read as a pair.
 *
 * THE IMAGE BOX IS RESERVED BY ASPECT RATIO, NOT BY width/height ATTRIBUTES. An
 * authored image has whatever intrinsic size it has, so stating dimensions would be a
 * lie that buys nothing; `LoCard`'s band solves the identical problem the identical
 * way. This is what keeps CLS at zero. `object-contain`, never `cover` — an
 * introduction's illustration must not be cropped.
 *
 * Spec: docs/specs/2026-09-11-intro-outcomes-and-split-design.md §3 (amended 2026-10-13).
 */
import { CircleCheck } from 'lucide-react';
import Callout from '@/components/shell/Callout';
import { resolveAsset } from '@/lib/assets';
import { RichText } from '../rich-text/RichText';
import { OutcomesBlockContentSchema } from './outcomes-block-schema';
import { parseBlockContent } from './parse-block-content';

export function OutcomesBlock({ content }: { content: unknown }) {
  const { lead, items, image } = parseBlockContent('outcomes', OutcomesBlockContentSchema, content);

  const callout = (
    <Callout
      className="px-4 py-3"
      title={
        <p className="text-base font-semibold">
          <RichText nodes={lead} />
        </p>
      }
    >
      <ul className="mt-2 grid gap-1.5 text-base">
        {items.map((item, index) => (
          // Outcome text is the only identity an outcome has; index is stable
          // because the list is static config, never reordered at runtime.
          <li key={index} className="flex items-start gap-2 text-foreground">
            {/* mt-1 drops the 18px tick onto the first line's x-height. */}
            <CircleCheck className="mt-1 size-4.5 shrink-0 text-success" aria-hidden="true" />
            {/* min-w-0: a flex item will not shrink below its min-content width by
                default, so one long unbroken word in an authored outcome would push
                the row wider than its track and undo the minmax(0,Nfr) above. */}
            <span className="min-w-0">
              <RichText nodes={item} />
            </span>
          </li>
        ))}
      </ul>
    </Callout>
  );

  if (image === undefined) {
    return <div className="max-w-(--measure)">{callout}</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
      {callout}
      <div className="aspect-[3/2] w-full overflow-hidden rounded-lg border bg-card shadow-sm">
        <img
          src={resolveAsset(image.src)}
          alt={image.alt}
          // An empty alt is the author saying "decoration"; take it out of the tree
          // entirely rather than leaving a nameless <img> in it.
          aria-hidden={image.alt === '' ? true : undefined}
          loading="lazy"
          decoding="async"
          className="size-full object-contain"
        />
      </div>
    </div>
  );
}
