/**
 * useNaturalSize.ts — an image's own pixel size, "W × H", for the Images section's
 * badges (maintainer, 2026-10-08). `null` until the browser has decoded it, so the
 * prerender and the first client render agree.
 */
import { useEffect, useRef, useState, type RefObject } from 'react';

export function useNaturalSize(): {
  ref: RefObject<HTMLImageElement | null>;
  size: string | null;
  measure: () => void;
} {
  const ref = useRef<HTMLImageElement>(null);
  const [size, setSize] = useState<string | null>(null);
  const measure = () => {
    const img = ref.current;
    if (img && img.naturalWidth > 0) setSize(`${img.naturalWidth} × ${img.naturalHeight}`);
  };
  // An image cached before hydration fires no load event, so read it once mounted.
  useEffect(measure, []);
  return { ref, size, measure };
}
