/**
 * parsing.ts — shared sentence parser for fill-blank exercises (spec §8, "ported
 * once"). Ported from french-lo-1's exerciseParsing.js, typed.
 *
 * Authored text embeds blanks inside square brackets:
 *   "Yo [soy|*es|eres] aquí."     choice blank — `*` marks the correct option
 *   (typed-answer blanks `[expected::placeholder]` arrive with engine #4's
 *    parseInputBlank — not ported yet, YAGNI.)
 *
 * `parseSentence` walks the string once and yields an ordered segment list:
 *   - text segments  → { key, type: 'text', value }   (HTML entities decoded)
 *   - blank segments → whatever the injected `parseBlank` returns
 * It owns the parts every engine shares (regex walk, slicing, entity decoding,
 * tail handling, blank-index bookkeeping); each engine supplies only `parseBlank`.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §8.
 */
import { decodeHtmlEntities } from './html';

/** A run of literal text between blanks (entities already decoded). */
export interface TextSegment {
  key: string;
  type: 'text';
  value: string;
}

/** What a blank handler returns: the metadata to record + the segment to render. */
export interface BlankParseResult<TMeta, TSegment> {
  meta: TMeta;
  segment: TSegment;
}

export interface ParseSentenceOptions<TMeta, TSegment> {
  /** First blank index — lets a caller continue numbering across sentences. */
  startBlankIndex?: number;
  /**
   * Optional accumulator the parser writes each blank's metadata into, at its
   * blankIndex. Provided and mutated in place by design: the engine collects
   * winner/options metadata during its render walk (not an immutable input).
   */
  blanksMeta?: TMeta[];
  /** Per-blank handler: turns the raw inner text into metadata + a segment. */
  parseBlank: (rawInner: string, blankIndex: number) => BlankParseResult<TMeta, TSegment>;
}

export interface ParseSentenceResult<TSegment> {
  segments: Array<TextSegment | TSegment>;
  nextBlankIndex: number;
}

const BLANK_REGEX = /\[([^\]]+)\]/g;

export function parseSentence<TMeta, TSegment>(
  text: string,
  { startBlankIndex = 0, blanksMeta, parseBlank }: ParseSentenceOptions<TMeta, TSegment>,
): ParseSentenceResult<TSegment> {
  const segments: Array<TextSegment | TSegment> = [];
  // Fresh regex state per call (BLANK_REGEX is global/stateful via lastIndex).
  const regex = new RegExp(BLANK_REGEX.source, 'g');
  let blankIndex = startBlankIndex;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        key: `text-${blankIndex}-${lastIndex}`,
        type: 'text',
        value: decodeHtmlEntities(text.slice(lastIndex, match.index)),
      });
    }

    const { meta, segment } = parseBlank(match[1], blankIndex);
    if (blanksMeta) blanksMeta[blankIndex] = meta;
    segments.push(segment);

    blankIndex += 1;
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({
      key: `tail-${blankIndex}-${lastIndex}`,
      type: 'text',
      value: decodeHtmlEntities(text.slice(lastIndex)),
    });
  }

  return { segments, nextBlankIndex: blankIndex };
}

/** Metadata for a multiple-choice blank: the option labels + index of the winner. */
export interface ChoiceMeta {
  options: string[];
  winner: number;
}

/** Render segment for a choice blank (the engine maps blankIndex → its <Select>). */
export interface ChoiceSegment {
  blankIndex: number;
  key: string;
  type: 'choice';
}

/**
 * Blank handler for multiple-choice blanks: `[suis|*es|est]`. The `*`-prefixed
 * option is the winner; options are trimmed and entity-decoded. `winner` is -1
 * when no option is marked (an authoring error the engine surfaces).
 */
export function parseChoiceBlank(
  rawInner: string,
  blankIndex: number,
): BlankParseResult<ChoiceMeta, ChoiceSegment> {
  const rawOptions = rawInner.split('|').map((opt) => opt.trim());
  const winner = rawOptions.findIndex((opt) => opt.startsWith('*'));
  const options = rawOptions.map((opt) =>
    decodeHtmlEntities(opt.startsWith('*') ? opt.substring(1).trim() : opt),
  );

  return {
    meta: { options, winner },
    segment: { blankIndex, key: `choice-${blankIndex}`, type: 'choice' },
  };
}
