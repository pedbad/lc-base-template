/**
 * parse-block-content.ts — validate one block's `content` against its per-type
 * schema, naming the TYPE in the failure.
 *
 * `BlockConfigSchema.content` is deliberately loose (the same deferral the exercise
 * engines use), so the per-type shape is checked by the renderer. When it fails, the
 * useful fact is which type's contract was broken — `01-vocabulary/block.json` was
 * already valid as an envelope, so the author's mistake is the content shape.
 *
 * Lives in its own module because the renderers import it and the registry imports
 * the renderers.
 */
import { z } from 'zod';

/** Parse `content` for a block of `type`, or throw naming the type and what broke. */
export function parseBlockContent<TSchema extends z.ZodTypeAny>(
  type: string,
  schema: TSchema,
  content: unknown,
): z.output<TSchema> {
  const result = schema.safeParse(content);
  if (!result.success) {
    throw new Error(`block type "${type}" has invalid content:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
