/**
 * OutcomesBlock — `type: "outcomes"`. The lead-in, a ticked list of what a learner
 * will be able to do, and an optional illustration beside them.
 *
 * TWO COLUMNS AT `lg`, STACKED BELOW IT. The reference splits at `lg` too, and 768 is
 * too narrow for a two-column introduction carrying artwork. Tracks are
 * `minmax(0,1fr)` rather than a bare `1fr` because a long unbroken word in an outcome
 * blows out a `1fr` track and takes the page into horizontal overflow with it.
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
 * THE IMAGE BOX IS RESERVED BY ASPECT RATIO, NOT BY width/height ATTRIBUTES. An
 * authored image has whatever intrinsic size it has, so stating dimensions would be a
 * lie that buys nothing; `LoCard`'s band solves the identical problem the identical
 * way. This is what keeps CLS at zero. `object-contain`, never `cover` — an
 * introduction's illustration must not be cropped.
 *
 * Spec: docs/specs/2026-09-11-intro-outcomes-and-split-design.md §3.
 */
import { CircleCheck } from 'lucide-react';
import { resolveAsset } from '@/lib/assets';
import { RichText } from '../rich-text/RichText';
import { OutcomesBlockContentSchema } from './outcomes-block-schema';
import { parseBlockContent } from './parse-block-content';

export function OutcomesBlock({ content }: { content: unknown }) {
  const { lead, items, image } = parseBlockContent('outcomes', OutcomesBlockContentSchema, content);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <div>
        <p className="font-medium text-foreground">
          <RichText nodes={lead} />
        </p>
        <ul className="mt-3 grid gap-2">
          {items.map((item, index) => (
            // Outcome text is the only identity an outcome has; index is stable
            // because the list is static config, never reordered at runtime.
            <li key={index} className="flex items-start gap-2 text-muted-foreground">
              <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
              {/* min-w-0: a flex item will not shrink below its min-content width by
                  default, so one long unbroken word in an authored outcome would push
                  the row wider than its track and undo the minmax(0,1fr) above. */}
              <span className="min-w-0">
                <RichText nodes={item} />
              </span>
            </li>
          ))}
        </ul>
      </div>

      {image === undefined ? null : (
        <div className="aspect-[3/2] w-full">
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
      )}
    </div>
  );
}
