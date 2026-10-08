/**
 * VocabularyBlock — `type: "vocabulary"`. A term/gloss list, rendered as a `<dl>`:
 * the description-list element IS the semantic for "term and its definition", so no
 * `<ul>` of `<span>` pairs.
 *
 * `lang` (spec §3, WCAG 3.1.2) is per-part, not per-block: the TERM is target
 * language, its GLOSS is the UI language, so only the `<dt>` carries TARGET_LANG.
 *
 * A term may carry a CLIP of itself being said. It renders as the same speaker button
 * `RichText` uses for an inline audio node, so audio looks and behaves the same
 * wherever a learner meets it.
 *
 * The button sits inside the `<dt>` and BEFORE the word. Inside, because a control in
 * a column of its own is separated from the thing it plays for anyone navigating by
 * element. Before, because it gives every row one shared left edge to scan down and
 * click, and because a vocabulary list is heard before it is read — the clip is the
 * way in to the word, not an afterthought hung off its end.
 */
import type { MouseEvent } from 'react';
import { AudioClip } from '@/components/audio/AudioClip';
import { TARGET_LANG } from '@/lib/lang';
import { parseBlockContent } from './parse-block-content';
import { VocabularyBlockContentSchema } from './vocabulary-block-schema';

/**
 * Forward a click anywhere on the row to the row's own speaker button.
 *
 * Ported from french-lo-1's `handleRowClick` (PhraseTable.jsx), including the reason
 * it DELEGATES rather than playing the clip itself: the button already owns the
 * playback state — what is playing, the progress ring, stopping every other clip —
 * so a second entry point that called the audio layer directly would be a second
 * source of truth for the same fact.
 *
 * Returns early when the click landed on the button, or the press began on it: the
 * button's own handler is about to run, and firing this too would toggle it twice and
 * leave a clip stopped the instant it started.
 */
function playRowClip(event: MouseEvent<HTMLDivElement>): void {
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest('button')) return;
  event.currentTarget.querySelector('button')?.click();
}

export function VocabularyBlock({ content }: { content: unknown }) {
  const { items } = parseBlockContent('vocabulary', VocabularyBlockContentSchema, content);

  return (
    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[max-content_1fr]">
      {items.map((item) => (
        // THE WHOLE ROW PLAYS THE CLIP, and it is a MOUSE affordance only — no role,
        // no tabIndex, no key handler, so it never enters the accessibility tree. That
        // is deliberate, not an omission: the speaker inside is a real <button>, so
        // keyboard and screen-reader users already have the clip on one tab stop.
        // Giving the row a role as well would announce and tab-stop every word twice
        // to buy those users nothing. WCAG asks for equivalent keyboard access, which
        // the button is — it does not ask every mouse convenience to be duplicated.
        //
        // Only a row WITH a clip gets the cursor and the hover: a pointer over a row
        // that does nothing is a promise the page cannot keep.
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- mouse-only enhancement over the speaker <button>, which is the keyboard path; see above
        <div
          key={item.term}
          onClick={item.audio === undefined ? undefined : playRowClip}
          className={`grid gap-x-6 rounded-md sm:col-span-2 sm:grid-cols-subgrid ${
            item.audio === undefined
              ? ''
              : 'cursor-pointer transition-colors hover:bg-muted motion-reduce:transition-none'
          }`}
        >
          <dt lang={TARGET_LANG} className="flex items-center gap-2 font-medium text-foreground">
            {item.audio === undefined ? null : (
              // The same speaker `RichText` renders for an inline audio node, so a
              // clip looks and behaves identically wherever it appears. `title` is
              // its accessible name: the button has no text of its own, and "play"
              // alone would be identical on every row of the list.
              <AudioClip
                className="super-compact-speaker"
                inline
                soundFile={item.audio}
                title={`Listen: ${item.term}`}
              />
            )}
            {item.term}
          </dt>
          {/* Centred like the term, which sits beside a 54px speaker. */}
          <dd className="self-center text-muted-foreground">{item.gloss}</dd>
        </div>
      ))}
    </dl>
  );
}
