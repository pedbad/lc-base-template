/**
 * ImageCompare.tsx — one mark drawn for both grounds, shown as a before/after slider
 * (E20, after shadcn's image-comparison gallery piece; our own, no dependency).
 *
 * The dark-ground image fills the frame; the light-ground image sits over it, clipped
 * with `clip-path` at the handle, which the compositor redraws without layout. A native
 * range input holds the position, so keys, touch and screen readers work as they do on
 * any slider; pointer drag on the frame sets the same value. The visible handle is
 * decorative. No animation, so nothing here reads reduced motion. The position starts
 * at a constant, so the prerender and the first client render agree.
 */
import { useRef, useState, type PointerEvent, type Ref } from 'react';
import { resolveAsset } from '@/lib/assets';
import { clipRight, positionFromPointer, START_POSITION } from './compare-position';

/** What the caller may hang on one side's <img>: the Images section reads its size. */
export interface SideImage {
  readonly ref?: Ref<HTMLImageElement>;
  readonly onLoad?: () => void;
}

interface Props {
  /** The mark's name, for the slider's accessible name. */
  readonly name: string;
  /** `public/`-relative path of the mark drawn for a light ground. */
  readonly light: string;
  /** `public/`-relative path of the mark drawn for a dark ground. */
  readonly dark: string;
  readonly lightImage?: SideImage;
  readonly darkImage?: SideImage;
}

const LAYER = 'absolute inset-0 flex items-center justify-center p-6';
const CHIP = 'absolute top-2 rounded-sm border border-current px-1.5 text-xs font-medium';

export default function ImageCompare({ name, light, dark, lightImage, darkImage }: Props) {
  const [position, setPosition] = useState(START_POSITION);
  const inputRef = useRef<HTMLInputElement>(null);

  const follow = (event: PointerEvent<HTMLDivElement>) => {
    const frame = event.currentTarget.getBoundingClientRect();
    setPosition(positionFromPointer(event.clientX, frame.left, frame.width));
  };
  // Without preventDefault the browser's own mousedown moves focus to <body> straight
  // after we hand it to the input, and the arrow keys stop working (found by hand).
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    inputRef.current?.focus({ preventScroll: true });
    follow(event);
  };
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) follow(event);
  };

  return (
    <div
      className="relative h-48 cursor-ew-resize touch-pan-y overflow-hidden rounded-sm select-none has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <div className={`${LAYER} bg-(--mark-ground-dark)`}>
        <img
          ref={darkImage?.ref}
          src={resolveAsset(dark)}
          alt=""
          draggable={false}
          onLoad={darkImage?.onLoad}
          className="max-h-full max-w-full object-contain"
        />
        <span className={`${CHIP} right-2 text-(--mark-ground-light)`}>Dark</span>
      </div>
      <div
        className={`${LAYER} bg-(--mark-ground-light)`}
        style={{ clipPath: clipRight(position) }}
      >
        <img
          ref={lightImage?.ref}
          src={resolveAsset(light)}
          alt=""
          draggable={false}
          onLoad={lightImage?.onLoad}
          className="max-h-full max-w-full object-contain"
        />
        <span className={`${CHIP} left-2 text-(--mark-ground-dark)`}>Light</span>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 flex w-0.5 -translate-x-1/2 items-center justify-center bg-primary"
        style={{ left: `${position}%` }}
      >
        <span className="flex size-7 shrink-0 items-center justify-center gap-1 rounded-full border-2 border-primary bg-background shadow-md">
          <span className="h-3 w-0.5 rounded-full bg-primary" />
          <span className="h-3 w-0.5 rounded-full bg-primary" />
        </span>
      </div>
      <input
        ref={inputRef}
        type="range"
        min={0}
        max={100}
        step={1}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label={`Compare light and dark: ${name}`}
        className="sr-only"
      />
    </div>
  );
}
