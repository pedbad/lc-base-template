/**
 * answers.ts — answer normalization for typed-input exercises (spec §8, "ported
 * once"). Two levels, by design:
 *
 *  - normalizeAnswer       "light": fold apostrophe variants, collapse whitespace,
 *                          trim. For blanks where punctuation IS part of the answer.
 *  - normalizeForDictation "full": light + treat sentence punctuation and quote
 *                          marks as insignificant. For dictation (engine #6), where
 *                          a missed comma shouldn't fail an otherwise-correct line.
 *
 * Both NFC-normalize but NEVER strip accents — grading is accent-sensitive (é ≠ e),
 * so accents are preserved intentionally.
 *
 * Ported from french-lo-1's utils/answerNormalize.js (typed). `normalizeAnswer`
 * powers engine #4 (inline-gap) now; `normalizeForDictation` is ported alongside it
 * for engine #6 and is exercised by its own test.
 */

/** Fold curly/back/acute apostrophe variants to a straight apostrophe. */
const APOSTROPHE_VARIANTS = /[’`´ʻʼ]/g;
/** Sentence punctuation treated as insignificant in dictation (incl. Spanish ¿ ¡). */
const SENTENCE_PUNCTUATION = /[.,!?;:…¿¡]/g;
/** Quotation marks (guillemets + curly quotes) treated as insignificant in dictation. */
const QUOTATION_MARKS = /[«»“”„"]/g;

/** Light normalize: apostrophe variants → "'", whitespace collapsed, trimmed. */
export const normalizeAnswer = (value: string = ''): string =>
  `${value}`.normalize('NFC').replace(APOSTROPHE_VARIANTS, "'").replace(/\s+/g, ' ').trim();

/**
 * Full normalize for dictation comparison: everything normalizeAnswer does, plus
 * sentence punctuation and quotation marks replaced with spaces so they don't
 * affect equality. Accents remain strict.
 */
export const normalizeForDictation = (text: string = ''): string =>
  `${text}`
    .normalize('NFC')
    .replace(APOSTROPHE_VARIANTS, "'")
    .replace(SENTENCE_PUNCTUATION, ' ')
    .replace(QUOTATION_MARKS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
