/**
 * Tests for the line-match content + config schemas (spec §8). Each item is a
 * picture↔word pair; keys (id ?? label) must be unique so a match grades correctly.
 */
import { describe, expect, test } from 'vitest';
import {
  LineMatchContentSchema,
  LineMatchExerciseConfigSchema,
  lineMatchItemKey,
} from './line-match-schema';

describe('lineMatchItemKey', () => {
  test('prefers id, falls back to label', () => {
    expect(lineMatchItemKey({ id: 'c1', label: 'el círculo', image: 'a.svg' })).toBe('c1');
    expect(lineMatchItemKey({ label: 'el círculo', image: 'a.svg' })).toBe('el círculo');
  });
});

describe('LineMatchContentSchema', () => {
  test('parses items with image + label', () => {
    const parsed = LineMatchContentSchema.parse({
      items: [
        { label: 'el círculo', image: 'lm/circle.svg' },
        { label: 'el cuadrado', image: 'lm/square.svg' },
      ],
    });
    expect(parsed.items).toHaveLength(2);
  });

  test('allows optional id, audio, alt, localLanguage and a footnote', () => {
    const parsed = LineMatchContentSchema.parse({
      items: [
        {
          id: 'c',
          label: 'el círculo',
          image: 'lm/circle.svg',
          audio: 'lm/c.wav',
          alt: 'a red circle',
          localLanguage: 'circle',
        },
        { id: 's', label: 'el cuadrado', image: 'lm/square.svg' },
      ],
      footnote: 'Empareja la imagen con la palabra.',
    });
    expect(parsed.items[0].alt).toBe('a red circle');
    expect(parsed.footnote).toBe('Empareja la imagen con la palabra.');
  });

  test('requires at least two items (a match needs options)', () => {
    expect(() =>
      LineMatchContentSchema.parse({ items: [{ label: 'solo', image: 'x.svg' }] }),
    ).toThrow();
  });

  test('rejects duplicate keys (ambiguous match)', () => {
    expect(() =>
      LineMatchContentSchema.parse({
        items: [
          { label: 'el círculo', image: 'a.svg' },
          { label: 'el círculo', image: 'b.svg' },
        ],
      }),
    ).toThrow();
  });
});

describe('LineMatchExerciseConfigSchema', () => {
  test('parses a full line-match envelope', () => {
    const parsed = LineMatchExerciseConfigSchema.parse({
      type: 'line-match',
      content: {
        items: [
          { label: 'el círculo', image: 'lm/circle.svg' },
          { label: 'el cuadrado', image: 'lm/square.svg' },
        ],
      },
      options: { sampleSize: 2 },
    });
    expect(parsed.type).toBe('line-match');
    expect(parsed.options?.sampleSize).toBe(2);
  });

  test('rejects a non-line-match type', () => {
    expect(() =>
      LineMatchExerciseConfigSchema.parse({
        type: 'select',
        content: {
          items: [
            { label: 'a', image: 'a.svg' },
            { label: 'b', image: 'b.svg' },
          ],
        },
      }),
    ).toThrow();
  });
});
