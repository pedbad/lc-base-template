/**
 * Tests for the shared sentence parser (parseSentence) and the choice-blank
 * handler (parseChoiceBlank). These power every fill-blank engine; `select` is
 * the first consumer (winner marked by a `*` prefix: `[suis|*es|est]`).
 */
import { describe, expect, test } from 'vitest';
import {
  choiceBlankProblems,
  countBlanks,
  inputBlankProblems,
  parseChoiceBlank,
  parseInputBlank,
  parseSentence,
  type ChoiceMeta,
  type InputMeta,
} from './parsing';

describe('parseChoiceBlank', () => {
  test('splits options and finds the *-marked winner', () => {
    const { meta, segment } = parseChoiceBlank('suis|*es|est', 0);
    expect(meta.options).toEqual(['suis', 'es', 'est']);
    expect(meta.winner).toBe(1);
    expect(segment).toEqual({ blankIndex: 0, key: 'choice-0', type: 'choice' });
  });

  test('trims whitespace and decodes entities in options', () => {
    const { meta } = parseChoiceBlank(' a | *b&apos;c | d ', 0);
    expect(meta.options).toEqual(['a', "b'c", 'd']);
    expect(meta.winner).toBe(1);
  });

  test('winner is -1 when no option is marked', () => {
    const { meta } = parseChoiceBlank('uno|dos|tres', 3);
    expect(meta.winner).toBe(-1);
  });

  test('uses the supplied blankIndex in the segment key', () => {
    const { segment } = parseChoiceBlank('a|*b', 7);
    expect(segment.blankIndex).toBe(7);
    expect(segment.key).toBe('choice-7');
  });
});

describe('parseInputBlank', () => {
  test('splits expected from placeholder on "::"', () => {
    const { meta, segment } = parseInputBlank('mange::type here', 0);
    expect(meta.expected).toBe('mange');
    expect(meta.placeholder).toBe('type here');
    expect(segment).toEqual({ blankIndex: 0, key: 'input-0', type: 'input' });
  });

  test('placeholder is empty when no "::" is present', () => {
    const { meta } = parseInputBlank('mange', 0);
    expect(meta.expected).toBe('mange');
    expect(meta.placeholder).toBe('');
  });

  test('trims and decodes entities in the expected answer', () => {
    const { meta } = parseInputBlank(' l&apos;eau :: indice ', 0);
    expect(meta.expected).toBe("l'eau");
    expect(meta.placeholder).toBe('indice');
  });

  test('widthCh floors at 6+2 for short answers and grows with length', () => {
    expect(parseInputBlank('va', 0).meta.widthCh).toBe(8); // max(2,6)+2
    expect(parseInputBlank('anticonstitutionnel', 0).meta.widthCh).toBe(21); // 19+2
  });

  test('feeds parseSentence to produce input segments', () => {
    const blanksMeta: InputMeta[] = [];
    const { segments, nextBlankIndex } = parseSentence('Je [mange::indice] du pain.', {
      blanksMeta,
      parseBlank: parseInputBlank,
    });
    expect(segments.map((s) => s.type)).toEqual(['text', 'input', 'text']);
    expect(nextBlankIndex).toBe(1);
    expect(blanksMeta[0]).toEqual({ expected: 'mange', placeholder: 'indice', widthCh: 8 });
  });
});

describe('parseSentence', () => {
  test('returns a single text segment when there are no blanks', () => {
    const { segments, nextBlankIndex } = parseSentence('Hola mundo', {
      parseBlank: parseChoiceBlank,
    });
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ type: 'text', value: 'Hola mundo' });
    expect(nextBlankIndex).toBe(0);
  });

  test('splits text around a choice blank and emits the choice segment', () => {
    const blanksMeta: ChoiceMeta[] = [];
    const { segments, nextBlankIndex } = parseSentence('Yo [soy|*es] aquí.', {
      blanksMeta,
      parseBlank: parseChoiceBlank,
    });
    expect(segments.map((s) => s.type)).toEqual(['text', 'choice', 'text']);
    expect(segments[0]).toMatchObject({ type: 'text', value: 'Yo ' });
    expect(segments[2]).toMatchObject({ type: 'text', value: ' aquí.' });
    expect(nextBlankIndex).toBe(1);
    expect(blanksMeta[0]).toEqual({ options: ['soy', 'es'], winner: 1 });
  });

  test('numbers multiple blanks and continues from startBlankIndex', () => {
    const blanksMeta: ChoiceMeta[] = [];
    const { segments, nextBlankIndex } = parseSentence('[a|*b] y [*c|d]', {
      startBlankIndex: 2,
      blanksMeta,
      parseBlank: parseChoiceBlank,
    });
    const choices = segments.filter((s) => s.type === 'choice');
    expect(choices.map((s) => (s as { blankIndex: number }).blankIndex)).toEqual([2, 3]);
    expect(nextBlankIndex).toBe(4);
    expect(blanksMeta[2]).toEqual({ options: ['a', 'b'], winner: 1 });
    expect(blanksMeta[3]).toEqual({ options: ['c', 'd'], winner: 0 });
  });

  test('decodes HTML entities in text segments', () => {
    const { segments } = parseSentence('l&apos;agua [es|*está]', {
      parseBlank: parseChoiceBlank,
    });
    expect(segments[0]).toMatchObject({ type: 'text', value: "l'agua " });
  });

  test('emits a trailing text segment after the last blank', () => {
    const { segments } = parseSentence('[a|*b] fin', { parseBlank: parseChoiceBlank });
    expect(segments[segments.length - 1]).toMatchObject({ type: 'text', value: ' fin' });
  });
});

// Audit 2026-10-23 (TODO §E34): a blank no learner could answer passed the build, as
// every option graded wrong. These checks read the sentence the way the engine does.
describe('choiceBlankProblems', () => {
  test('finds nothing wrong with well-formed blanks', () => {
    expect(choiceBlankProblems('Yo [*soy|eres] y tú [soy|*eres].')).toEqual([]);
  });

  test('finds nothing wrong with a sentence that has no blank', () => {
    expect(choiceBlankProblems('Vivo en Madrid.')).toEqual([]);
  });

  test('names a blank with no correct option', () => {
    expect(choiceBlankProblems('Yo [soy|eres|es] de Madrid.')).toEqual([
      expect.stringContaining('[soy|eres|es] has no correct option'),
    ]);
  });

  test('names a blank with more than one correct option', () => {
    expect(choiceBlankProblems('Yo [*soy|*eres|es].')).toEqual([
      expect.stringContaining('[*soy|*eres|es] marks 2 options correct'),
    ]);
  });

  test.each(['Yo [soy||*es].', 'Yo [*soy|es| ].'])(
    'names a blank with an empty option: %s',
    (text) => {
      expect(choiceBlankProblems(text)).toEqual([expect.stringContaining('has an empty option')]);
    },
  );

  test('names a correct mark with no option after it', () => {
    expect(choiceBlankProblems('Yo [*|es].')).toEqual([
      expect.stringContaining('write the option after the *'),
    ]);
  });

  // The views run these checks in the browser too, where every entity is decoded, and
  // in Node only `&apos;` is. Judged on the written text, the verdict is the same in both.
  test('judges options as written, before any entity is decoded', () => {
    expect(choiceBlankProblems("[l&apos;eau|*l'eau]")).toEqual([]);
  });

  test('names a blank that offers the same option twice', () => {
    expect(choiceBlankProblems('Ella [es|*es].')).toEqual([
      expect.stringContaining('[es|*es] offers "es" twice'),
    ]);
  });

  test.each(['Yo [*soy|eres de Madrid.', 'Yo *soy|eres] de Madrid.', 'Yo [a [*b|c] d].'])(
    'names brackets that do not pair up: %s',
    (text) => {
      expect(choiceBlankProblems(text)).toContainEqual(
        expect.stringContaining('brackets that do not pair up'),
      );
    },
  );

  test('names every faulty blank in one sentence', () => {
    expect(choiceBlankProblems('[a|b] y [*c|*d]')).toHaveLength(2);
  });
});

describe('inputBlankProblems', () => {
  test('finds nothing wrong with well-formed blanks', () => {
    expect(inputBlankProblems('Yo me [llamo::llamarse] y [soy] de Madrid.')).toEqual([]);
  });

  test.each(['Yo me [::llamarse] Ana.', 'Yo me [ ] Ana.', 'Yo me [ :: hint] Ana.'])(
    'names a blank with no answer: %s',
    (text) => {
      expect(inputBlankProblems(text)).toEqual([expect.stringContaining('has no answer')]);
    },
  );

  test('names brackets that do not pair up', () => {
    expect(inputBlankProblems('Yo me [llamo::llamarse Ana.')).toContainEqual(
      expect.stringContaining('brackets that do not pair up'),
    );
  });

  test('names a blank written as a choice, which no learner would type', () => {
    expect(inputBlankProblems('Yo [*soy|eres|es] de Madrid.')).toEqual([
      expect.stringContaining('[*soy|eres|es] is written as a choice'),
    ]);
  });
});

describe('countBlanks', () => {
  test('counts the blanks the parser finds', () => {
    expect(countBlanks('[a|*b] y [*c|d]')).toBe(2);
    expect(countBlanks('Je [mange::manger].')).toBe(1);
    expect(countBlanks('Vivo en Madrid.')).toBe(0);
  });
});
