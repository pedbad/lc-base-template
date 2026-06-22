/**
 * prepareChoiceItems.ts — the pure ordering layer shared by the choice-blank
 * engines (select, inline-choice; spec §5.2, §6). Promoted from the select
 * engine's prepareItems.ts and made generic over the item shape, since every
 * choice engine carries `[a|*b|c]` blanks inside a `text` field.
 *
 * Immutable: returns NEW arrays/objects, never mutates input. RNG is injected so
 * tests are deterministic and Reset can produce a genuinely fresh order.
 *
 * One `options.shuffle` flag governs both kinds of randomization (spec §5.2):
 *   - choice order INSIDE each `[a|*b|c]` blank, and
 *   - the order of the items themselves.
 * `options.sampleSize` then limits how many items show. Shuffle on → the slice is
 * a random N (items already shuffled); shuffle off → the first N in authored order
 * (so a narrative/counting order is preserved). Matches french-lo-1's behavior,
 * unified behind the single shared flag.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §5.2, §6.
 */
import { shuffle } from '@/exercises/lib/shuffle';

/** Resolved subset of ExerciseOptions this layer cares about. */
export interface PrepareChoiceOptions {
  shuffle: boolean;
  sampleSize?: number;
}

/** The minimum an item must carry: the sentence text with its `[a|*b|c]` blanks. */
interface ChoiceItemLike {
  text: string;
}

/**
 * Reorder the options inside every `[...]` blank of a sentence, preserving the
 * `*` winner marker (which moves with its option). Text without blanks is returned
 * unchanged. Returns a new string.
 */
export function shuffleItemChoices(text: string, rng: () => number): string {
  if (!text.includes('[')) return text;

  return text.replace(/\[([^\]]+)\]/g, (_match, group: string) => {
    const options = group.split('|').map((opt) => opt.trim());
    return `[${shuffle(options, rng).join('|')}]`;
  });
}

/**
 * Produce the items to render from the authored items + behavior options. Generic
 * over the item type `T` (any shape with a `text` field), so each choice engine
 * keeps its own content type while sharing this ordering logic.
 * @param rng injectable RNG (defaults to Math.random); pass a seeded one for tests
 *   and Reset.
 */
export function prepareChoiceItems<T extends ChoiceItemLike>(
  items: readonly T[],
  options: PrepareChoiceOptions,
  rng: () => number = Math.random,
): T[] {
  const withShuffledChoices = options.shuffle
    ? items.map((item) => ({ ...item, text: shuffleItemChoices(item.text, rng) }))
    : items.map((item) => ({ ...item }));

  const ordered = options.shuffle ? shuffle(withShuffledChoices, rng) : withShuffledChoices;

  const { sampleSize } = options;
  if (typeof sampleSize === 'number' && sampleSize > 0) {
    return ordered.slice(0, sampleSize);
  }
  return ordered;
}
