/**
 * image-pairs.ts — finds the images drawn twice, once for a light ground and once for
 * a dark one, so the sandbox can show each pair as one comparison slider (E20).
 *
 * Pairs come from the repo's file-naming convention, not a hand-kept list:
 * `<name>-black` goes with `<name>-white`, `<name>-light` with `<name>-dark`, in the
 * same folder with the same extension. `-black` and `-light` are the marks for a light
 * ground. A variant whose other half is missing is an ORPHAN: it still renders as a
 * single tile, and `image-pairs.test.ts` fails until the missing file is added.
 */

export interface ImagePair {
  /** The file stem without its variant suffix, e.g. `lc-logo`. */
  readonly name: string;
  /** The mark drawn for a light ground (`-black` / `-light`). */
  readonly light: string;
  /** The mark drawn for a dark ground (`-white` / `-dark`). */
  readonly dark: string;
}

export interface ImageGroups {
  readonly pairs: readonly ImagePair[];
  /** Every image not in a pair, orphans included, in the input order. */
  readonly singles: readonly string[];
  /** Variants whose other half is missing. */
  readonly orphans: readonly string[];
}

type Variant = 'black' | 'white' | 'light' | 'dark';

const VARIANT_FILE = /^(.*\/)?([^/]+)-(black|white|light|dark)(\.[^./]+)$/;

const PARTNER: Readonly<Record<Variant, Variant>> = {
  black: 'white',
  white: 'black',
  light: 'dark',
  dark: 'light',
};

const FOR_LIGHT_GROUND: ReadonlySet<Variant> = new Set(['black', 'light']);

interface ParsedVariant {
  readonly name: string;
  readonly variant: Variant;
  readonly partner: string;
}

function parseVariant(file: string): ParsedVariant | null {
  const match = VARIANT_FILE.exec(file);
  if (!match) return null;
  const [, folder = '', name = '', raw, extension = ''] = match;
  const variant = raw as Variant;
  return { name, variant, partner: `${folder}${name}-${PARTNER[variant]}${extension}` };
}

export function groupImages(files: readonly string[]): ImageGroups {
  const present = new Set(files);
  const paired = new Set<string>();
  const pairs: ImagePair[] = [];
  const orphans: string[] = [];

  for (const file of files) {
    const parsed = parseVariant(file);
    if (!parsed || paired.has(file)) continue;
    if (!present.has(parsed.partner)) {
      orphans.push(file);
      continue;
    }
    const isLight = FOR_LIGHT_GROUND.has(parsed.variant);
    pairs.push({
      name: parsed.name,
      light: isLight ? file : parsed.partner,
      dark: isLight ? parsed.partner : file,
    });
    paired.add(file).add(parsed.partner);
  }

  return { pairs, singles: files.filter((file) => !paired.has(file)), orphans };
}
