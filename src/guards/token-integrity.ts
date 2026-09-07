/**
 * token-integrity.ts — guard f: no raw colour or length bypasses the token chain
 * (buildlist 24, spec §136–138).
 *
 * THE BUG CLASS. The design system is a three-link chain, and its whole value is that
 * the top link is the only place a brand value is written down:
 *
 *   palette.css        →  tokens.css              →  home.css, flashcards.css, …
 *   Layer 1: raw values   Layer 2/3: meanings         components read tokens
 *   `--slate-3: #546072`  `--border: var(--slate-3)`  `border-color: var(--border)`
 *
 * Change a value once at the top and everything downstream follows. Write `#546072`
 * straight into a component and that value becomes INVISIBLE from the top of the chain:
 * the next re-skin edits palette.css, the component ignores it, and the mismatch shows up
 * as a slightly-wrong colour that nobody can grep for because the hex no longer matches.
 *
 * WHAT THIS GUARDS. Nothing, today. The repo was fully compliant when this was written
 * (TODO §A-f): 17 hex literals, all of them in palette.css where the file header already
 * says "the ONLY place real colour literals live", and 52 px sites, every one on a
 * property where px is correct. Guard f fixes nothing. Its entire value is stopping the
 * FIRST author who writes `padding: 24px` instead of a token — which nothing catches
 * today, and which no test would fail on.
 *
 * THAT INVERTS THE DIFFICULTY. When the repo is already clean, the hard part is not
 * detecting a violation — it is NOT FLAGGING CORRECT CODE. A guard that fires on the four
 * brand hexes in the `tokens-variant-a/b/c.css` headers, or on the four
 * `calc(var(--radius) ± 4px)` sites, is a guard someone switches off in its first week.
 * So the rule below is a set of four deliberate narrowings, each one answering a question
 * the survey got WRONG on first assumption.
 *
 * THE RULE — px IS A PROPERTY ALLOWLIST, NOT A BAN. Spec §138 reads "no raw px in
 * components", but 44 of the repo's 52 px sites are 1–4px hairlines and focus rings,
 * where px is the CORRECT unit and rem would actively be wrong: a 1px border must not
 * scale with the user's font size. So px is legitimate on `border*`, `outline*`,
 * `box-shadow`, `backdrop-filter`, `perspective` and `transform`, and a violation
 * everywhere else — `font-size`, `padding`, `margin`, `gap`, `width`, `height`, `inset`,
 * `top`/`left`. There are currently ZERO of those, which is the point: the guard is a
 * lock on a door nobody has opened yet.
 *
 * A px INSIDE A TOKEN-REFERENCING calc() IS ALLOWED. `calc(var(--radius) + 4px)` goes
 * THROUGH the token — a derivative offset, not a bypass, and the chain working exactly as
 * designed. Four sites read that way (`home.css`, `flashcards.css`, `drag-fill-gaps.css`,
 * `word-spot.css`). This was the survey's biggest reversal: the naive reading calls them
 * violations and flags four correct sites on day one.
 *
 * A px IN A CUSTOM PROPERTY IS ALLOWED. Naming a raw value is what a token IS — a
 * `--hairline: 1px` in a component sheet is a component-level token, which §136 provides
 * for. The allowlist is about the property BEING SET, and `--x` sets nothing. The hex half
 * gets the OPPOSITE treatment: `--card-tint: #f0f0f0` is still a violation, because Layer
 * 1 is palette.css alone and a local colour primitive is precisely the drift this guards.
 *
 * HEX IS BANNED EVERYWHERE EXCEPT palette.css. One file-scoped exemption, matching that
 * file's own header, rather than a per-value allowlist that would need editing on every
 * re-skin.
 *
 * SCOPE — `src/components/ui/` IS EXEMPT. Nine of the eleven Tailwind arbitrary-value
 * hits in the repo live there, and they are shadcn-GENERATED: `shadcn add` would re-break
 * the build on every regeneration, so the guard would be failing on code no author here
 * wrote or can keep clean. Guard c set the precedent for a written-down scope exclusion
 * (it skips `*.test.*` and `*.fixture.*`); this is the same call for the same reason.
 *
 * AN ARBITRARY BREAKPOINT IS NOT A VIOLATION. `min-[980px]:hidden` in
 * `LineMatchExercise.tsx` is a Tailwind arbitrary variant — a media query, i.e. a
 * CONDITION rather than a value — and the CSS half already allows px in `@media`. Any
 * bracket group followed by `:` is a variant and is left alone for that reason.
 *
 * MECHANISM — VITEST, DECIDED NOT INHERITED. Stylelint already runs (`bun run lint:css`)
 * and `declaration-property-unit-allowed-list` would own the px half natively, catching
 * mistakes in the editor as you type. It was still the wrong home, for two concrete
 * reasons rather than consistency alone: it cannot express "px is allowed inside a calc()
 * that references a token", which is four of the repo's real sites, and it cannot see the
 * TSX surface at all. Splitting one rule across two tools would also make `bun run guards`
 * a half-truth — it globs `src/guards/`, so a stylelint-owned half would silently not be
 * in it. All eight guards stay in one place and in that one script.
 */
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { lineAt, stripComments } from './asset-path';
import { parseCss, type StyleViolation } from './css-source';

/**
 * Properties where a raw px length is the RIGHT answer, not a token bypass: hairlines,
 * focus rings, shadow geometry and 3D/transform distances. Matched as prefixes, so
 * `border-radius`, `border-inline-end` and `outline-offset` are covered by `border`
 * and `outline`.
 */
const PX_ALLOWED_PROPERTY_PREFIXES = [
  'border',
  'outline',
  'box-shadow',
  'backdrop-filter',
  'perspective',
  'transform',
] as const;

/** Math functions whose body may legitimately offset a token by a raw px. */
const MATH_FUNCTIONS = ['calc', 'min', 'max', 'clamp'] as const;

/** The one file allowed to hold real colour literals — Layer 1 of the chain. */
const PALETTE_FILE = /(^|[\\/])styles[\\/]palette\.css$/;

/** Generated shadcn components: excluded from the markup sweep. See the header. */
const GENERATED_MARKUP_DIR = `${path.sep}components${path.sep}ui${path.sep}`;

/** Directory names never worth walking. */
const SKIPPED_DIRS = ['node_modules', 'dist', '.git'] as const;

/** A raw px length. The lookbehind keeps `--space-4px-ish` style names out of it. */
const PX_PATTERN = /(?<![\w.])-?\d*\.?\d+px\b/g;

/** A colour hex literal. `(?<!&)` keeps the decimal HTML entity `&#233;` out of it. */
const HEX_PATTERN = /(?<![&\w])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;

/** What one stylesheet contained, so a sweep can assert it saw what it expects to see. */
export interface CssTokenAudit {
  readonly violations: readonly StyleViolation[];
  /** Every px length in a declaration value, allowed or not. */
  readonly pxSites: number;
  /** Every colour hex in a declaration value, allowed or not. */
  readonly hexLiterals: number;
}

/** Whether px is the correct unit for this property rather than a missing token. */
function isPxAllowedOn(property: string): boolean {
  const name = property.trim().toLowerCase();
  if (name.startsWith('--')) return true; // declaring a token, not consuming one
  return PX_ALLOWED_PROPERTY_PREFIXES.some((prefix) => name.startsWith(prefix));
}

/**
 * Character ranges inside a value that sit within a math function referencing a token.
 *
 * `calc(var(--radius) + 4px)` yields the range covering `var(--radius) + 4px`, so the
 * `4px` inside it reads as a derivative of the token rather than a bypass of it.
 */
function tokenMathRanges(value: string): readonly [number, number][] {
  const ranges: [number, number][] = [];
  const opener = new RegExp(String.raw`\b(${MATH_FUNCTIONS.join('|')})\(`, 'g');

  for (const match of value.matchAll(opener)) {
    const bodyStart = (match.index ?? 0) + match[0].length;
    let depth = 1;
    let at = bodyStart;
    while (at < value.length && depth > 0) {
      if (value[at] === '(') depth += 1;
      else if (value[at] === ')') depth -= 1;
      at += 1;
    }
    const body = value.slice(bodyStart, depth === 0 ? at - 1 : at);
    if (body.includes('var(--')) ranges.push([bodyStart, bodyStart + body.length]);
  }

  return ranges;
}

/**
 * Every colour or length in one stylesheet that bypasses the token chain, plus the
 * totals a staleness floor can assert on.
 *
 * @param css Stylesheet text.
 * @param file Label used in the violation, normally a repo-relative path. It also
 *   decides the palette exemption, so pass the real path when sweeping the repo.
 */
export function auditCssTokens(css: string, file = '<stylesheet>'): CssTokenAudit {
  const violations: StyleViolation[] = [];
  const isPalette = PALETTE_FILE.test(file);
  let pxSites = 0;
  let hexLiterals = 0;

  // Only DECLARATIONS are examined. An at-rule prelude is skipped by construction, which
  // is what makes `@media (width >= 980px)` a breakpoint rather than a flagged value.
  for (const { property, value, line } of parseCss(css).declarations) {
    const safeRanges = tokenMathRanges(value);
    const isInsideTokenMath = (at: number): boolean =>
      safeRanges.some(([from, to]) => at >= from && at < to);

    for (const match of value.matchAll(PX_PATTERN)) {
      pxSites += 1;
      if (isPxAllowedOn(property) || isInsideTokenMath(match.index ?? 0)) continue;
      violations.push({
        file,
        line,
        rule: 'raw-px',
        detail: `${property}: ${value} — px is not a token here; use a token or a relative unit`,
      });
    }

    const hexes = value.match(HEX_PATTERN) ?? [];
    hexLiterals += hexes.length;
    for (const hex of isPalette ? [] : hexes) {
      violations.push({
        file,
        line,
        rule: 'raw-hex',
        detail: `${property}: ${value} — ${hex} belongs in styles/palette.css`,
      });
    }
  }

  return { violations, pxSites, hexLiterals };
}

/** Guard f's CSS half, for the reading a unit test wants. */
export function findCssTokenBypasses(css: string, file?: string): StyleViolation[] {
  return [...auditCssTokens(css, file).violations];
}

/** A Tailwind arbitrary value: a utility or variant prefix followed by `[…]`. */
const ARBITRARY_VALUE_PATTERN = /(?<![\w-])([a-zA-Z@][\w@./-]*)-\[([^\]]*)\](:?)/g;

/** An inline style object, up to its first `}}`. Style props here never nest. */
const INLINE_STYLE_PATTERN = /style=\{\{([\s\S]*?)\}\}/g;

/** A quoted string literal — the only place a markup file can hardcode a CSS value. */
const STRING_LITERAL_PATTERN = /(["'`])((?:\\.|(?!\1)[\s\S])*)\1/g;

/**
 * Every hardcoded colour or length in one markup file.
 *
 * Two sinks, because TSX has exactly two ways to set a style without going through CSS:
 * a Tailwind arbitrary value, and an inline `style={{}}` object. A computed value —
 * `` `${fromPx}px` `` in `LoAccordion.tsx` — is neither, because no author can hardcode
 * it; the patterns skip any literal carrying a `${` interpolation for that reason.
 *
 * @param source File contents.
 * @param file Label used in the violation, normally a repo-relative path.
 */
export function findMarkupTokenBypasses(source: string, file = '<source>'): StyleViolation[] {
  const violations: StyleViolation[] = [];
  const code = stripComments(source);

  const rawValueIn = (text: string): string => {
    if (text.includes('var(--') || text.includes('${')) return '';
    const px = PX_PATTERN.exec(text);
    PX_PATTERN.lastIndex = 0;
    if (px) return px[0];
    const hex = HEX_PATTERN.exec(text);
    HEX_PATTERN.lastIndex = 0;
    return hex?.[0] ?? '';
  };

  for (const match of code.matchAll(ARBITRARY_VALUE_PATTERN)) {
    const [, utility = '', body = '', variantColon = ''] = match;
    // A trailing `:` makes the bracket group a VARIANT — `min-[980px]:hidden`,
    // `data-[side=top]:` — which is a condition, not a value. Guard f's CSS half
    // already allows px inside `@media`, so the markup half allows it here.
    if (variantColon === ':') continue;
    const raw = rawValueIn(body);
    if (raw === '') continue;
    violations.push({
      file,
      line: lineAt(code, match.index ?? 0),
      rule: 'arbitrary-value',
      detail: `${utility}-[${body}] — use a token or a Tailwind scale step`,
    });
  }

  for (const styleMatch of code.matchAll(INLINE_STYLE_PATTERN)) {
    const body = styleMatch[1] ?? '';
    const bodyStart = (styleMatch.index ?? 0) + (styleMatch[0].length - body.length - 2);
    for (const literal of body.matchAll(STRING_LITERAL_PATTERN)) {
      const raw = rawValueIn(literal[2] ?? '');
      if (raw === '') continue;
      violations.push({
        file,
        line: lineAt(code, bodyStart + (literal.index ?? 0)),
        rule: 'inline-style',
        detail: `style={{ … ${literal[0]} … }} — use a token`,
      });
    }
  }

  return violations.sort((a, b) => a.line - b.line);
}

/**
 * Shipped `.ts`/`.tsx` under `src/`, minus tests, fixtures and generated shadcn.
 *
 * The `src/components/ui/` exclusion is the one scope decision guard f makes that guard c
 * did not — see the header for why regenerated code cannot be held to this rule.
 */
export function guardedMarkupFiles(repoRoot: string): string[] {
  const found: string[] = [];

  const step = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!(SKIPPED_DIRS as readonly string[]).includes(entry.name)) {
          step(path.join(dir, entry.name));
        }
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;
      if (/\.(test|fixture)\./.test(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (full.includes(GENERATED_MARKUP_DIR)) continue;
      found.push(full);
    }
  };

  step(path.join(repoRoot, 'src'));
  return found.sort();
}
