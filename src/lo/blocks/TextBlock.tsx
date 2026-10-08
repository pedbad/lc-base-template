/**
 * TextBlock — a block body that is just prose: one `<p>` per authored paragraph.
 *
 * `content.text` is an ARRAY of paragraphs, not one string the renderer splits.
 * Splitting prose on sentence boundaries in code guesses wrong on abbreviations,
 * decimals and quotations; the author already knows where the breaks belong.
 *
 * THREE registered types share this body. Two differ only in `lang` (spec §3, WCAG
 * 3.1.2): `prose` is UI-language commentary (a note — inherits `lang="en"` from
 * <html>), while `grammar` is target-language example text and must carry TARGET_LANG
 * so assistive tech pronounces it correctly. The third, `intro`, is `prose` wearing a
 * rule down its leading edge.
 *
 * WHY `intro` IS ITS OWN TYPE rather than a flag on `prose`. A lesson's opening
 * paragraphs are a recognisable thing an author reaches for once per LO, and giving
 * them their own type keeps every other `prose` note in the course plain. It is the
 * same move `grammar` already makes: one body, a second name, one difference.
 *
 * IT IS A `div`, NOT A `<blockquote>`. It is styled like a pull quote and is not one —
 * the text is the page's own voice, not matter quoted from elsewhere. `<blockquote>`
 * would announce a quotation to a screen reader that is not there, so the rule is
 * carried by a border on a plain wrapper and the accessibility tree stays honest.
 */
import { resolveAsset } from '@/lib/assets';
import { TARGET_LANG } from '@/lib/lang';
import { RichTextEntries } from '../rich-text/RichTextEntries';
import { parseBlockContent } from './parse-block-content';
import { IntroBlockContentSchema, TextBlockContentSchema } from './text-block-schema';

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
      {/* Paragraphs and blocks (lists, tables, the audio player) the author wrote,
          already parsed to a validated tree — spec §14. */}
      <RichTextEntries entries={text} paragraphClassName="text-foreground" />
    </div>
  );
}

/** `type: "prose"` — UI-language commentary (notes, asides). */
export function ProseBlock({ content }: { content: unknown }) {
  return <TextBlock content={content} type="prose" />;
}

/**
 * `type: "intro"` — the lesson's opening paragraphs, set off by a rule on the
 * leading edge. Same body and same UI language as `prose`; only the wrapper differs,
 * so nothing about the text's meaning changes with it.
 *
 * `border-s-4` / `ps-5` are the LOGICAL properties, not `border-l-4` / `pl-5`: the
 * rule belongs on the side the text STARTS on, which follows the document's writing
 * direction instead of hardcoding "left" for a template meant to be cloned per course.
 */
export function IntroBlock({ content }: { content: unknown }) {
  const { image } = parseBlockContent('intro', IntroBlockContentSchema, content);
  const ruled = (
    <div className="rich-text-full border-s-4 border-accent ps-5">
      <TextBlock content={content} type="intro" />
    </div>
  );
  if (image === undefined) return ruled;

  // With an illustration (maintainer, 2026-10-08, after french-lo-1's
  // instructions-media): the outcomes block's split — text left, picture right from
  // `lg`, text first on a phone — and its 3:2 contain box, so the picture is the
  // introduction illustration's size. Same classes, so no new CSS.
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      {ruled}
      <div className="aspect-[3/2] w-full">
        <img
          src={resolveAsset(image.src)}
          alt={image.alt}
          // An empty alt is the author saying "decoration"; take it out of the tree.
          aria-hidden={image.alt === '' ? true : undefined}
          loading="lazy"
          decoding="async"
          className="size-full object-contain"
        />
      </div>
    </div>
  );
}

/** `type: "grammar"` — target-language example prose. */
export function GrammarBlock({ content }: { content: unknown }) {
  return <TextBlock content={content} type="grammar" lang={TARGET_LANG} />;
}
