/**
 * Tests for answer normalization. The contract that matters for grading: accents
 * are preserved (é ≠ e), apostrophe variants fold, whitespace collapses, and the
 * dictation variant additionally ignores sentence punctuation and quotes.
 */
import { expect, test } from 'bun:test';
import { normalizeAnswer, normalizeForDictation } from './answers';

test('normalizeAnswer: trims and collapses internal whitespace', () => {
  expect(normalizeAnswer('  je   suis  ')).toBe('je suis');
});

test('normalizeAnswer: folds apostrophe variants to a straight quote', () => {
  expect(normalizeAnswer('l’eau')).toBe("l'eau");
  expect(normalizeAnswer('l´eau')).toBe("l'eau");
});

test('normalizeAnswer: preserves accents (accent-sensitive grading)', () => {
  expect(normalizeAnswer('étudiant')).toBe('étudiant');
  expect(normalizeAnswer('étudiant')).not.toBe('etudiant');
});

test('normalizeAnswer: keeps sentence punctuation (significant here)', () => {
  expect(normalizeAnswer('Bonjour, ça va?')).toBe('Bonjour, ça va?');
});

test('normalizeAnswer: empty / undefined input returns empty string', () => {
  expect(normalizeAnswer('')).toBe('');
  expect(normalizeAnswer()).toBe('');
});

test('normalizeForDictation: ignores sentence punctuation differences', () => {
  expect(normalizeForDictation('Bonjour, ça va?')).toBe(normalizeForDictation('Bonjour ça va'));
});

test('normalizeForDictation: ignores quotation-mark differences', () => {
  expect(normalizeForDictation('«oui»')).toBe(normalizeForDictation('oui'));
});

test('normalizeForDictation: still preserves accents', () => {
  expect(normalizeForDictation('élève.')).toBe('élève');
  expect(normalizeForDictation('élève.')).not.toBe('eleve');
});
