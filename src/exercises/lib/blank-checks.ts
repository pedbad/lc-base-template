/**
 * blank-checks.ts — the load-time checks for sentences with blanks, as Zod pieces the
 * engine schemas share (TODO §E34). The checks themselves are in `parsing.ts`, beside
 * the parser they read through, so the build accepts exactly what the engine can grade;
 * this file only turns what they find into issues on the right field.
 */
import { z } from 'zod';
import { countBlanks } from './parsing';

/** A sentence field: each fault `problemsOf` finds is an issue on this sentence. */
export function sentenceWithBlanks(problemsOf: (text: string) => string[]) {
  return z
    .string()
    .min(1)
    .superRefine((text, ctx) => {
      for (const message of problemsOf(text)) ctx.addIssue({ code: 'custom', message });
    });
}

/** True when at least one of the sentences holds a blank, so there is something to answer. */
export function hasAnyBlank(items: readonly { text: string }[]): boolean {
  return items.some((item) => countBlanks(item.text) > 0);
}

/** The issue for content with no blank anywhere; `example` shows the engine's blank. */
export function noBlankIssue(example: string) {
  return { message: `no sentence has a blank: write each one as ${example}`, path: ['items'] };
}
