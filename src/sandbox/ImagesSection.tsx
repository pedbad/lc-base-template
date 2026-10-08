/**
 * ImagesSection.tsx — every image the app uses, with its path and pixel size
 * (maintainer, 2026-10-08, after french-lo-1's debug page). The list is
 * `APP_IMAGES`, which `app-assets.test.ts` keeps in step with public/. Placeholders
 * show their size label; marks meant for a dark ground (`-white`, `-dark`) sit on one.
 */
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { resolveAsset } from '@/lib/assets';
import { APP_IMAGES } from './app-assets';

/** Marks drawn for a dark background, by the repo's file-naming convention. */
const isForDarkGround = (file: string): boolean => /-(white|dark)\./.test(file);

function ImageTile({ file }: { file: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [size, setSize] = useState<string | null>(null);
  const measure = () => {
    const img = ref.current;
    if (img && img.naturalWidth > 0) setSize(`${img.naturalWidth} × ${img.naturalHeight}`);
  };
  // An image cached before hydration fires no load event, so read it once mounted.
  useEffect(measure, []);

  return (
    <li className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
      <div
        className={`flex h-32 items-center justify-center rounded-sm p-2 ${isForDarkGround(file) ? 'bg-foreground' : 'bg-muted'}`}
      >
        <img
          ref={ref}
          src={resolveAsset(file)}
          alt=""
          onLoad={measure}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <code className="text-xs break-all">{`public/${file}`}</code>
      {/* The file's pixel size in a shadcn Badge, so it stands out (2026-10-08). */}
      <Badge className="self-start tabular-nums">{size ?? 'loading…'}</Badge>
    </li>
  );
}

export default function ImagesSection() {
  return (
    <section aria-labelledby="images-heading" className="scroll-mt-8" id="images">
      <h2 id="images-heading" className="font-heading text-2xl font-bold">
        Images
      </h2>
      <p className="mt-2 max-w-(--measure) text-muted-foreground">
        Every image under <code>public/</code> that the app uses, with its path and its file’s own
        pixel size. Placeholders print the size to supply on themselves; replace the file at its
        path. Reference images through <code>resolveAsset()</code>, never as a bare path.
      </p>
      <ul className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-4">
        {APP_IMAGES.map((file) => (
          <ImageTile key={file} file={file} />
        ))}
      </ul>
    </section>
  );
}
