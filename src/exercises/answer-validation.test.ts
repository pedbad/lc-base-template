/**
 * answer-validation.test.ts — every engine refuses, at load, content no learner could
 * answer (TODO §E42). The matrix, one row per kind of answer:
 *
 * | Answer kind                      | Engines                                        | Check                                        |
 * | -------------------------------- | ---------------------------------------------- | -------------------------------------------- |
 * | `[a|*b]` choice in a sentence    | select, inline-choice, reading passage         | E34/E35: parsing.ts, judged decoded          |
 * | `[answer::hint]` in a sentence   | inline-gap                                     | E34/E35: parsing.ts, judged decoded          |
 * | choice labels in their own field | radio-quiz, reading radio, line-match, memory  | non-empty, distinct, judged as written       |
 * | typed answer in its own field    | typed-transform, conjugation                   | non-empty after normalizeAnswer              |
 * |                                  | dictation                                      | non-empty after normalizeForDictation        |
 * | ordered or dragged tiles         | word-order, phrase-reorder, drag-fill-gaps     | non-empty; repeats allowed, graded by text   |
 * | `[target]` to click              | word-spot                                      | non-empty                                    |
 * | no grading                       | flashcards                                     | none needed                                  |
 *
 * Fields in their own JSON property are shown as written (React prints them; nothing
 * decodes an entity), so they are judged as written, never decoded. Two labels are the
 * same when they normalize the same way typed answers do: spacing, Unicode form and
 * apostrophe shape fold; capitals and accents stay, so `Sí` and `si` are real choices.
 */
import { describe, expect, it } from 'vitest';
import { exerciseConfigSchema } from './exercise-schemas';
import type { ExerciseType } from '@/config/exercise-types';

function problems(type: ExerciseType, content: unknown): string[] {
  const result = exerciseConfigSchema(type).safeParse({ type, content });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

const radio = (...options: string[]) => ({ questions: [{ prompt: '¿Cómo?', options }] });

describe('radio-quiz: options a learner can tell apart', () => {
  it('refuses two options that show the same once the * is gone', () => {
    expect(problems('radio-quiz', radio('*sí', 'sí')).join()).toMatch(
      /question 1 offers "sí" twice/,
    );
    expect(problems('radio-quiz', radio('*sí', 'sí ', 'no'))).not.toEqual([]);
  });

  it('refuses a correct option that is only the *', () => {
    expect(problems('radio-quiz', radio('*', 'no')).join()).toMatch(
      /question 1 marks an empty option correct/,
    );
  });

  it('refuses an option that shows as nothing', () => {
    expect(problems('radio-quiz', radio('*sí', '  ')).join()).toMatch(
      /question 1 has an option that shows as nothing/,
    );
  });

  it('keeps capitals, accents and entities as written as real differences', () => {
    expect(problems('radio-quiz', radio('*Sí', 'sí'))).toEqual([]);
    expect(problems('radio-quiz', radio('*sí', 'si'))).toEqual([]);
    expect(problems('radio-quiz', radio('*é', '&eacute;'))).toEqual([]);
  });

  it('names the question that is wrong', () => {
    const content = {
      questions: [
        { prompt: 'a', options: ['*uno', 'dos'] },
        { prompt: 'b', options: ['*tres', 'tres'] },
      ],
    };
    expect(problems('radio-quiz', content).join()).toMatch(/question 2/);
  });
});

describe('reading: radio questions and the true/false labels', () => {
  const reading = (question: object, extra: object = {}) => ({
    passage: 'Texto.',
    questions: [question],
    ...extra,
  });

  it('refuses repeated or empty options', () => {
    const repeated = { type: 'radio', prompt: 'p', options: ['sí', 'sí'], answer: 'sí' };
    expect(problems('reading', reading(repeated)).join()).toMatch(/question 1 offers "sí" twice/);
    const empty = { type: 'radio', prompt: 'p', options: ['sí', ' '], answer: 'sí' };
    expect(problems('reading', reading(empty)).join()).toMatch(/shows as nothing/);
  });

  it('refuses true and false labels that look the same', () => {
    const question = { type: 'true-false', prompt: 'p', answer: true };
    expect(
      problems('reading', reading(question, { trueLabel: 'Sí', falseLabel: 'Sí ' })).join(),
    ).toMatch(/trueLabel and falseLabel/);
  });
});

describe('line-match and memory-match: words a learner can tell apart', () => {
  const pair = (word: string, id: string) => ({ id, label: word, text: word, image: 'a.svg' });

  it('refuses two pictures whose words look the same, even with different ids', () => {
    const items = [pair('gato', 'a'), pair('gato ', 'b')];
    expect(problems('line-match', { items }).join()).toMatch(/item 2 shows "gato", as item 1 does/);
    expect(problems('memory-match', { items }).join()).toMatch(
      /item 2 shows "gato", as item 1 does/,
    );
  });

  it('refuses a word that shows as nothing', () => {
    const items = [pair('gato', 'a'), pair('  ', 'b')];
    expect(problems('line-match', { items }).join()).toMatch(/item 2 shows as nothing/);
    expect(problems('memory-match', { items }).join()).toMatch(/item 2 shows as nothing/);
  });
});

describe('typed answers mean something after the engine normalizes them', () => {
  const rows = (answer: string) => ({ rows: [{ prompt: 'x', answer, audio: 'audio/a.m4a' }] });

  it('refuses a whitespace-only answer in typed-transform and dictation', () => {
    expect(problems('typed-transform', rows(' ')).join()).toMatch(/row 1 has no answer/);
    expect(problems('dictation', rows(' ')).join()).toMatch(/row 1 has no answer/);
  });

  it("refuses a dictation answer that is only what dictation's grading ignores", () => {
    expect(problems('dictation', rows('¿?')).join()).toMatch(/row 1 has nothing to type/);
    expect(problems('typed-transform', rows('¿?'))).toEqual([]);
  });

  it('keeps accented and capitalised answers', () => {
    expect(problems('typed-transform', rows('Él está'))).toEqual([]);
    expect(problems('dictation', rows('¿Qué tal?'))).toEqual([]);
  });

  it('refuses a whitespace-only conjugation form', () => {
    const content = {
      verb: 'ser',
      rows: [
        { person: 'yo', answer: 'soy' },
        { person: 'tú', answer: ' ' },
      ],
    };
    expect(problems('conjugation', content).join()).toMatch(/row 2 \(tú\) has no answer/);
  });
});

describe('conjugation: only the mode that is built', () => {
  it('refuses choice mode, which learners would only see as a notice', () => {
    const content = { verb: 'ser', answerMode: 'choice', rows: [{ person: 'yo', answer: 'soy' }] };
    expect(problems('conjugation', content).join()).toMatch(/choice mode is not available yet/);
  });

  it('accepts typed mode, written or left out', () => {
    const rows = [{ person: 'yo', answer: 'soy' }];
    expect(problems('conjugation', { verb: 'ser', rows })).toEqual([]);
    expect(problems('conjugation', { verb: 'ser', answerMode: 'typed', rows })).toEqual([]);
  });
});

describe('ordered and dragged tiles', () => {
  it('refuses a word-order word or a phrase that shows as nothing', () => {
    expect(problems('word-order', { words: ['Yo', ' ', 'soy'] }).join()).toMatch(
      /word 2 shows as nothing/,
    );
    const rows = [{ phrase: 'Hola' }, { phrase: ' ' }];
    expect(problems('phrase-reorder', { rows }).join()).toMatch(/row 2 shows as nothing/);
  });

  it('keeps repeated words, which real sentences have', () => {
    expect(problems('word-order', { words: ['la', 'casa', 'de', 'la', 'abuela'] })).toEqual([]);
  });

  it('refuses a sentence whose words are all the same: there is no order to find', () => {
    expect(problems('word-order', { words: ['sí', 'sí'] }).join()).toMatch(
      /needs at least two different words/,
    );
    expect(problems('phrase-reorder', { rows: [{ phrase: 'a' }, { phrase: 'a' }] }).join()).toMatch(
      /needs at least two different phrases/,
    );
  });

  it('refuses a drag-fill-gaps blank with nothing in it', () => {
    const items = [{ text: 'Soy [ ] y [estudiante].' }, { text: 'Es [mi] casa.' }];
    expect(problems('drag-fill-gaps', { items }).join()).toMatch(/sentence 1 has an empty blank/);
  });
});

describe('word-spot: something to click', () => {
  it('refuses a target that shows as nothing', () => {
    const items = [{ text: 'el ch[ic]o' }, { text: 'la [ ] casa' }];
    expect(problems('word-spot', { items }).join()).toMatch(/line 2 has an empty \[ \] target/);
  });
});
