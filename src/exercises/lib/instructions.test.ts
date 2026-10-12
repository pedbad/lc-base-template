/**
 * Tests for the instruction copy map and resolver (handover spec §3, §7).
 */
import { describe, expect, test } from 'vitest';
import { EXERCISE_TYPE_KEYS } from '@/config/exercise-types';
import {
  EXERCISE_INSTRUCTIONS,
  SAVED_PROGRESS_INSTRUCTIONS,
  resolveInstructions,
  savesProgress,
} from './instructions';

describe('EXERCISE_INSTRUCTIONS', () => {
  test('has non-empty copy for every exercise type key (exhaustive)', () => {
    for (const type of EXERCISE_TYPE_KEYS) {
      const copy = EXERCISE_INSTRUCTIONS[type];
      expect(typeof copy).toBe('string');
      expect(copy.trim().length).toBeGreaterThan(0);
    }
  });

  test('has no extra keys beyond EXERCISE_TYPE_KEYS', () => {
    expect(Object.keys(EXERCISE_INSTRUCTIONS).sort()).toEqual([...EXERCISE_TYPE_KEYS].sort());
  });

  test('memory-match copy references Reset but not Check (§4 caveat)', () => {
    const copy = EXERCISE_INSTRUCTIONS['memory-match'];
    expect(copy).toContain('**Reset**');
    expect(copy).not.toContain('Check');
  });
});

describe('resolveInstructions', () => {
  test('returns the type default when override is absent', () => {
    expect(resolveInstructions('select')).toBe(EXERCISE_INSTRUCTIONS.select);
    expect(resolveInstructions('select', undefined)).toBe(EXERCISE_INSTRUCTIONS.select);
  });

  test('returns a non-empty override verbatim', () => {
    expect(resolveInstructions('select', 'Do this thing.')).toBe('Do this thing.');
  });

  test('suppresses (null) when override is an empty string', () => {
    expect(resolveInstructions('select', '')).toBeNull();
  });

  test('suppresses (null) when override is explicit null', () => {
    expect(resolveInstructions('select', null)).toBeNull();
  });

  test('falls back to the default for a whitespace-only override', () => {
    expect(resolveInstructions('radio-quiz', '   ')).toBe(EXERCISE_INSTRUCTIONS['radio-quiz']);
  });
});

// Maintainer, 2026-10-12: flashcards lost Show answer (the card itself flips) and
// Restart (now the shared Reset, which keeps saved memory). A deck that saves progress
// also says so, and how to clear it.
describe('flashcards instructions', () => {
  test('say to tap the card, name Reset, and drop the old buttons', () => {
    const copy = EXERCISE_INSTRUCTIONS.flashcards;
    expect(copy).toMatch(/tap or click the card/i);
    expect(copy).toContain('**Reset**');
    expect(copy).not.toMatch(/Show answer|Restart/);
  });

  test('a deck that saves progress adds what that means and how to clear it', () => {
    const copy = resolveInstructions('flashcards', undefined, { savesProgress: true });
    expect(copy).toBe(`${EXERCISE_INSTRUCTIONS.flashcards} ${SAVED_PROGRESS_INSTRUCTIONS}`);
    expect(SAVED_PROGRESS_INSTRUCTIONS).toContain('**Clear saved progress**');
    expect(SAVED_PROGRESS_INSTRUCTIONS).toMatch(/even after \*\*Reset\*\*/);
  });

  test('an author override still wins, saved progress or not', () => {
    expect(resolveInstructions('flashcards', 'Mine.', { savesProgress: true })).toBe('Mine.');
  });

  test('savesProgress reads options.srs off an unknown config', () => {
    expect(savesProgress({ options: { srs: true } })).toBe(true);
    expect(savesProgress({ options: { srs: false } })).toBe(false);
    expect(savesProgress({ options: {} })).toBe(false);
    expect(savesProgress(null)).toBe(false);
  });
});
