/**
 * TextBlock — a block body that is just prose: one `<p>` per authored paragraph.
 *
 * `content.text` is an ARRAY of paragraphs, not one string the renderer splits.
 * Splitting prose on sentence boundaries in code guesses wrong on abbreviations,
 * decimals and quotations; the author already knows where the breaks belong.
 *
 * Two registered types share this body and differ only in `lang` (spec §3, WCAG
 * 3.1.2): `prose` is UI-language commentary (an introduction — inherits `lang="en"`
 * from <html>), while `grammar` is target-language example text and must carry
 * TARGET_LANG so assistive tech pronounces it correctly.
 */
import { TARGET_LANG } from '@/lib/lang';
import { parseBlockContent } from './parse-block-content';
import { TextBlockContentSchema } from './text-block-schema';

interface TextBlockProps {
  /** The block's `content`, validated here against TextBlockContentSchema. */
  content: unknown;
  /** The registered block type, named in a content-validation failure. */
  type: string;
  /** Set for target-language content; omitted for UI-language prose. */
  lang?: string;
}

export function TextBlock({ content, type, lang }: TextBlockProps) {
  const { text } = parseBlockContent(type, TextBlockContentSchema, content);

  return (
    <div className="space-y-3" lang={lang}>
      {text.map((paragraph, index) => (
        // Paragraph text is the only identity a paragraph has; index is stable
        // because the list is static config, never reordered at runtime.
        <p key={index} className="text-foreground">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

/** `type: "prose"` — UI-language commentary (introductions, notes). */
export function ProseBlock({ content }: { content: unknown }) {
  return <TextBlock content={content} type="prose" />;
}

/** `type: "grammar"` — target-language example prose. */
export function GrammarBlock({ content }: { content: unknown }) {
  return <TextBlock content={content} type="grammar" lang={TARGET_LANG} />;
}
