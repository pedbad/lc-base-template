/**
 * headingId — the single heading-id generation scheme for the whole shell.
 *
 * WHY (spec §5): french-lo-1 built heading ids two different ways (with vs without
 * a `target` prop), which let the `aria-labelledby` reference and the real heading
 * id drift apart. Every <section> heading and every accordion <summary> heading in
 * this template derives its id from THIS one function, so the reference and the
 * target can never disagree.
 */

/** Derive a heading element's id from its owner's base id (`grammar` →
 *  `grammar-heading`). Use for both `aria-labelledby` and the heading's own `id`. */
export function headingId(baseId: string): string {
  return `${baseId}-heading`;
}
