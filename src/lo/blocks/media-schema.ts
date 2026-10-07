/**
 * media-schema.ts — one media group: an optional image, an optional long audio
 * player, and the player's transcript. Used by a tab's `media` today, and by a
 * standalone media block later — which is why it is its own file.
 *
 * TWO IMAGE KINDS, because a face and a chart need different layouts (spec §1):
 * a `portrait` of the speaker sits beside the player; a `figure` the dialogue is
 * about spans the panel in a `<figure>`.
 *
 * ALT IS REQUIRED ON EVERY IMAGE. A portrait may say `""` — the explicit decorative
 * choice, as in the outcomes block — because the speaker's words are in the
 * transcript. A figure may not: a chart carries information, so its alt states the
 * takeaway (WCAG 1.1.1), and only a figure takes a caption.
 *
 * AUDIO AND TRANSCRIPT COME TOGETHER. Audio without a transcript locks out a learner
 * who cannot hear it; a transcript without audio transcribes nothing. Both fail the
 * build with the path named, as does an empty group.
 *
 * Every path is under the key `src`, which guard d already collects, so a missing
 * file fails the build too. STRICT throughout: a misspelt key fails.
 *
 * Spec: docs/specs/2026-10-07-tabs-media-design.md §3.
 */
import { z } from 'zod';
import { TextBlockContentSchema } from './text-block-schema';

/** One authored rich-text entry array, parsed to `RichTextEntry[]`. */
const RichTextEntriesSchema = TextBlockContentSchema.shape.text;

export const MediaImageSchema = z.strictObject({
  /** `portrait` sits beside the player; `figure` spans the panel. */
  kind: z.enum(['portrait', 'figure']),
  /** Project-relative asset path; rendered through `resolveAsset()`. */
  src: z.string().min(1),
  /** Required. `""` is allowed on a portrait only — see the header. */
  alt: z.string(),
  /** A figure's visible caption. */
  caption: z.string().min(1).optional(),
});
export type MediaImage = z.infer<typeof MediaImageSchema>;

export const MediaAudioSchema = z.strictObject({
  /** Project-relative asset path; rendered through `resolveAsset()`. */
  src: z.string().min(1),
  /** The player's visible label and accessible name. */
  label: z.string().min(1).optional(),
});
export type MediaAudio = z.infer<typeof MediaAudioSchema>;

export const MediaSchema = z
  .strictObject({
    image: MediaImageSchema.optional(),
    audio: MediaAudioSchema.optional(),
    /** What the audio says, one entry per paragraph. */
    transcript: RichTextEntriesSchema.optional(),
  })
  .superRefine((media, ctx) => {
    const { image, audio, transcript } = media;
    if (image === undefined && audio === undefined) {
      ctx.addIssue({ code: 'custom', path: [], message: 'media needs an image, audio or both' });
    }
    if (audio !== undefined && transcript === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['transcript'],
        message: 'audio needs a transcript — a learner who cannot hear the clip reads it',
      });
    }
    if (audio === undefined && transcript !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['transcript'],
        message: 'a transcript needs audio to transcribe',
      });
    }
    if (image?.kind === 'figure' && image.alt.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['image', 'alt'],
        message: 'a figure carries information — its alt must state the takeaway',
      });
    }
    if (image?.kind === 'portrait' && image.caption !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['image', 'caption'],
        message: 'only a figure takes a caption',
      });
    }
  });
export type Media = z.infer<typeof MediaSchema>;
