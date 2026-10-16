/**
 * ImagesSection.tsx — every image the app uses, with its path and pixel size
 * (maintainer, 2026-10-08, after french-lo-1's debug page). The list is
 * `APP_IMAGES`, which `app-assets.test.ts` keeps in step with public/. A mark drawn
 * for both grounds (`-black`/`-white`, `-light`/`-dark`) shows once, as a comparison
 * slider with each side on its own fixed ground (E20); the rest keep a plain tile, and
 * placeholders show their size label.
 */
import { Badge } from '@/components/ui/badge';
import { resolveAsset } from '@/lib/assets';
import { APP_IMAGES } from './app-assets';
import { groupImages, type ImagePair } from './image-pairs';
import ImageCompare from './ImageCompare';
import { useNaturalSize } from './useNaturalSize';

const TILE = 'flex flex-col gap-3 rounded-md border border-border bg-card p-4';

/** A file's path and its pixel size in a shadcn Badge, so it stands out (2026-10-08). */
function ImageLabel({ file, size }: { file: string; size: string | null }) {
  return (
    <>
      <code className="text-xs break-all">{`public/${file}`}</code>
      <Badge className="self-start tabular-nums">{size ?? 'loading…'}</Badge>
    </>
  );
}

function ImageTile({ file }: { file: string }) {
  const { ref, size, measure } = useNaturalSize();
  return (
    <li className={TILE}>
      <div className="flex h-32 items-center justify-center rounded-sm bg-muted p-2">
        <img
          ref={ref}
          src={resolveAsset(file)}
          alt=""
          onLoad={measure}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <ImageLabel file={file} size={size} />
    </li>
  );
}

function PairTile({ pair }: { pair: ImagePair }) {
  const light = useNaturalSize();
  const dark = useNaturalSize();
  return (
    <li className={TILE}>
      <ImageCompare
        name={pair.name}
        light={pair.light}
        dark={pair.dark}
        lightImage={{ ref: light.ref, onLoad: light.measure }}
        darkImage={{ ref: dark.ref, onLoad: dark.measure }}
      />
      <ImageLabel file={pair.light} size={light.size} />
      <ImageLabel file={pair.dark} size={dark.size} />
    </li>
  );
}

export default function ImagesSection() {
  const { pairs, singles } = groupImages(APP_IMAGES);
  return (
    <section aria-labelledby="images-heading" className="scroll-mt-8" id="images">
      <h2 id="images-heading" className="font-heading text-2xl font-bold">
        Images
      </h2>
      <p className="mt-2 max-w-(--measure) text-muted-foreground">
        Every image under <code>public/</code> that the app uses, with its path and its file’s own
        pixel size. A mark drawn for both a light and a dark ground shows once: drag the handle, or
        use the arrow keys, to compare the two. Placeholders print the size to supply on themselves;
        replace the file at its path. Reference images through <code>resolveAsset()</code>, never as
        a bare path.
      </p>
      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {pairs.map((pair) => (
          <PairTile key={pair.name} pair={pair} />
        ))}
      </ul>
      <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-4">
        {singles.map((file) => (
          <ImageTile key={file} file={file} />
        ))}
      </ul>
    </section>
  );
}
