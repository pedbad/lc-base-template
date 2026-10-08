/**
 * MediaPanel — one media group: an image, a long audio player and its transcript.
 * Used inside a tab today; a standalone media block can render it unchanged.
 *
 * TWO LAYOUTS, picked by the image's kind (spec §1). A `portrait` sits beside the
 * player once this group's own container is `@md` wide, and stacks above it below
 * that — a container query, because a tab panel inside a card is narrower than the
 * viewport. A `figure` (a chart the dialogue is about) spans the group in `<figure>`
 * with its caption, the player beneath at the same width.
 *
 * THE TRANSCRIPT TOGGLE IS NATIVE `<details>`. The summary carries BOTH labels, each
 * with its icon, and `group-open:` shows the right one, so the accessible name is
 * always the visible label. No React state: it works before hydration, the prerender
 * equals the first client render, and the browser announces expanded/collapsed.
 *
 * The player is `AudioClip`'s native variant inside `.rich-text-player`, the same
 * element a rich-text audio player renders, so the two look identical.
 *
 * Spec: docs/specs/2026-10-07-tabs-media-design.md §4.
 */
import { Eye, EyeOff } from 'lucide-react';
import { AudioClip } from '@/components/audio/AudioClip';
import { FOCUS_OUTLINE } from '@/components/shell/focus-outline';
import { resolveLabel } from '@/config/ui-strings';
import { resolveAsset } from '@/lib/assets';
import { cn } from '@/lib/utils';
import { RichTextEntries } from '../rich-text/RichTextEntries';
import type { RichTextEntry } from '../rich-text/rich-text-nodes';
import type { Media, MediaAudio, MediaImage } from './media-schema';
import './media-panel.css';

/** The summary, styled as an amber button (--transcript-toggle); full width when narrow. */
const SUMMARY_CLASSES = [
  'inline-flex w-full cursor-pointer list-none items-center justify-center gap-2',
  'rounded-md border-2 border-warning bg-transcript-toggle px-4 py-2 font-semibold',
  'text-transcript-toggle-foreground hover:bg-transcript-toggle/85',
  '[&::-webkit-details-marker]:hidden @md:w-auto',
  FOCUS_OUTLINE,
].join(' ');

function MediaImg({ image, className }: { image: MediaImage; className: string }) {
  return (
    <img
      src={resolveAsset(image.src)}
      alt={image.alt}
      // An empty alt is the author saying "decoration": out of the tree entirely.
      aria-hidden={image.alt === '' ? true : undefined}
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}

function Transcript({ entries }: { entries: readonly RichTextEntry[] }) {
  return (
    // `media-transcript`: the open/close slide in media-panel.css.
    <details className="media-transcript group">
      <summary className={SUMMARY_CLASSES}>
        <span className="inline-flex items-center gap-2 group-open:hidden">
          <Eye aria-hidden="true" className="size-4" />
          {resolveLabel('showTranscript')}
        </span>
        <span className="hidden items-center gap-2 group-open:inline-flex">
          <EyeOff aria-hidden="true" className="size-4" />
          {resolveLabel('hideTranscript')}
        </span>
      </summary>
      <div className="mt-3 space-y-3 border-s-4 border-primary ps-4">
        <RichTextEntries entries={entries} paragraphClassName="text-foreground" />
      </div>
    </details>
  );
}

function Listening({
  audio,
  transcript,
  wide,
}: {
  audio: MediaAudio;
  transcript: readonly RichTextEntry[];
  /** Lift the player's 28rem cap so it spans a figure above it. */
  wide: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className={cn('rich-text-player', wide && '[&_audio]:max-w-none')}>
        <AudioClip soundFile={audio.src} listenText={audio.label ?? ''} />
      </div>
      <Transcript entries={transcript} />
    </div>
  );
}

export function MediaPanel({ media, className }: { media: Media; className?: string }) {
  const { image, audio, transcript } = media;
  // The schema pairs audio with a transcript; the types cannot, so check both.
  const listening =
    audio !== undefined && transcript !== undefined ? (
      <Listening audio={audio} transcript={transcript} wide={image?.kind === 'figure'} />
    ) : null;

  if (image?.kind === 'portrait') {
    return (
      <div className={cn('@container', className)}>
        <div className="grid gap-4 @md:grid-cols-3 @md:items-start">
          <MediaImg image={image} className="h-auto w-full max-w-48 rounded-lg @md:max-w-none" />
          <div className="@md:col-span-2">{listening}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('@container space-y-4', className)}>
      {image === undefined ? null : (
        <figure className="space-y-2">
          <MediaImg image={image} className="h-auto w-full rounded-lg border border-border" />
          {image.caption === undefined ? null : (
            <figcaption className="text-sm text-muted-foreground">{image.caption}</figcaption>
          )}
        </figure>
      )}
      {listening}
    </div>
  );
}
