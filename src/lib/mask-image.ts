/**
 * mask-image — the inline style that paints an asset as a mask on the element itself.
 *
 * WHY ON THE ELEMENT AND NOT THROUGH A CUSTOM PROPERTY. A relative `url()` inside a
 * custom property is resolved against the stylesheet that reads it, not the page. In a
 * `./` build (one build for any folder) the asset is `./logo.svg`, the reading
 * stylesheet is in `assets/`, and the browser asked for `assets/logo.svg`. An inline
 * `mask-image` resolves against the page, which is where the asset is.
 *
 * Both spellings: the build prefixes the CSS half of every mask (`mask-position` etc.)
 * for the browsers it targets, and an inline style is not prefixed by anyone.
 */
import type { CSSProperties } from 'react';

/** A resolved asset URL (from resolveAsset) → the element's mask-image style. */
export const maskImageStyle = (url: string): CSSProperties => {
  const image = `url("${url}")`;
  return { WebkitMaskImage: image, maskImage: image };
};
