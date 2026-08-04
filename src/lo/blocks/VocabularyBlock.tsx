/**
 * VocabularyBlock — `type: "vocabulary"`. A term/gloss list, rendered as a `<dl>`:
 * the description-list element IS the semantic for "term and its definition", so no
 * `<ul>` of `<span>` pairs.
 *
 * `lang` (spec §3, WCAG 3.1.2) is per-part, not per-block: the TERM is target
 * language, its GLOSS is the UI language, so only the `<dt>` carries TARGET_LANG.
 */
import { TARGET_LANG } from '@/lib/lang';
import { parseBlockContent } from './parse-block-content';
import { VocabularyBlockContentSchema } from './vocabulary-block-schema';

export function VocabularyBlock({ content }: { content: unknown }) {
  const { items } = parseBlockContent('vocabulary', VocabularyBlockContentSchema, content);

  return (
    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[max-content_1fr]">
      {items.map((item) => (
        <div key={item.term} className="grid gap-x-6 sm:col-span-2 sm:grid-cols-subgrid">
          <dt lang={TARGET_LANG} className="font-medium text-foreground">
            {item.term}
          </dt>
          <dd className="text-muted-foreground">{item.gloss}</dd>
        </div>
      ))}
    </dl>
  );
}
