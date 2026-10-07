/**
 * media-schema.test.ts — the media group's contract: image and/or audio, a transcript
 * exactly when there is audio, alt rules per image kind.
 *
 * Spec: docs/specs/2026-10-07-tabs-media-design.md §3.
 */
import { expect, test } from 'vitest';
import { MediaSchema } from './media-schema';

const portrait = { kind: 'portrait', src: 'images/x/speaker.svg', alt: '' };
const figure = {
  kind: 'figure',
  src: 'images/x/chart.svg',
  alt: 'Visits peak on Saturday',
  caption: 'Visits per day',
};
const audio = { src: 'audio/x/clip.m4a', label: 'Listen' };
const transcript = ['Line one.', 'Line <em>two</em>.'];

/** The issue paths of a failed parse. */
function issuePaths(input: unknown): unknown[] {
  const result = MediaSchema.safeParse(input);
  if (result.success) throw new Error('expected a validation failure');
  return result.error.issues.map((issue) => issue.path);
}

test('every valid combination parses', () => {
  expect(MediaSchema.safeParse({ image: portrait, audio, transcript }).success).toBe(true);
  expect(MediaSchema.safeParse({ image: figure, audio, transcript }).success).toBe(true);
  expect(MediaSchema.safeParse({ audio, transcript }).success).toBe(true);
  expect(MediaSchema.safeParse({ image: figure }).success).toBe(true);
  expect(MediaSchema.safeParse({ audio: { src: audio.src }, transcript }).success).toBe(true);
});

test('empty media is rejected — it needs an image or audio', () => {
  expect(issuePaths({})).toEqual([[]]);
});

test('audio without a transcript is rejected, naming the transcript', () => {
  expect(issuePaths({ audio })).toEqual([['transcript']]);
});

test('a transcript without audio is rejected — nothing to transcribe', () => {
  expect(issuePaths({ image: figure, transcript })).toEqual([['transcript']]);
});

test('a figure needs real alt text; a portrait may be decorative', () => {
  expect(issuePaths({ image: { ...figure, alt: ' ' } })).toEqual([['image', 'alt']]);
  expect(MediaSchema.safeParse({ image: portrait }).success).toBe(true);
});

test('alt is required on every image, even a portrait', () => {
  const noAlt = { kind: 'portrait', src: portrait.src };
  expect(issuePaths({ image: noAlt })).toEqual([['image', 'alt']]);
});

test('a caption belongs to a figure only', () => {
  expect(issuePaths({ image: { ...portrait, caption: 'Claire' } })).toEqual([['image', 'caption']]);
});

test('an unknown kind and a misspelt key both fail', () => {
  expect(MediaSchema.safeParse({ image: { ...figure, kind: 'photo' } }).success).toBe(false);
  expect(MediaSchema.safeParse({ audio, transcript, transcrpt: [] }).success).toBe(false);
  expect(MediaSchema.safeParse({ audio: { ...audio, scr: 'x' }, transcript }).success).toBe(false);
});

test('the transcript arrives as parsed rich-text entries', () => {
  const parsed = MediaSchema.parse({ audio, transcript });
  expect(parsed.transcript?.[1]?.kind).toBe('paragraph');
});
