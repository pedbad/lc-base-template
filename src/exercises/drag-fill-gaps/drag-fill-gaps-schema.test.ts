import { test, expect } from 'bun:test';
import {
  DragFillGapsContentSchema,
  DragFillGapsExerciseConfigSchema,
} from './drag-fill-gaps-schema';

test('drag-fill-gaps: accepts a valid config', () => {
  const parsed = DragFillGapsExerciseConfigSchema.safeParse({
    type: 'drag-fill-gaps',
    content: {
      items: [
        { text: 'Yo [soy] de Madrid.' },
        { text: 'Tú [eres] muy amable.', audio: 'audio/drag-fill-gaps/q2.wav' },
      ],
      footnote: 'Arrastra cada palabra a su hueco.',
    },
  });
  expect(parsed.success).toBe(true);
});

test('drag-fill-gaps: allows several blanks in one item', () => {
  const parsed = DragFillGapsContentSchema.safeParse({
    items: [{ text: 'Yo [soy] de Madrid y ella [vive] en París.' }],
  });
  expect(parsed.success).toBe(true);
});

test('drag-fill-gaps: rejects fewer than two blanks total', () => {
  const parsed = DragFillGapsContentSchema.safeParse({ items: [{ text: 'Yo [soy] de Madrid.' }] });
  expect(parsed.success).toBe(false);
});

test('drag-fill-gaps: rejects an item with no blanks at all', () => {
  const parsed = DragFillGapsContentSchema.safeParse({
    items: [{ text: 'Sin huecos aquí.' }, { text: 'Ni aquí tampoco.' }],
  });
  expect(parsed.success).toBe(false);
});

test('drag-fill-gaps: rejects the wrong type literal', () => {
  const parsed = DragFillGapsExerciseConfigSchema.safeParse({
    type: 'word-order',
    content: { items: [{ text: 'Yo [soy] de Madrid y [tú eres] amable.' }] },
  });
  expect(parsed.success).toBe(false);
});
