'use client';

import { PawIcon } from '@/components/icons/PawIcon';
import { imageUrl } from '@/lib/media/urls';
import type { PetPhotoRow } from '@/features/pets/types/pet.types';

interface Props {
  petName: string;
  coverCfImageId: string | null;
  photos: PetPhotoRow[];
  onOpen: () => void;
}

export function PetCoverWithStrip({ petName, coverCfImageId, photos, onOpen }: Props) {
  const cover = coverCfImageId ? imageUrl(coverCfImageId, 'public') : null;
  const strip = photos.slice(0, 4);

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        onClick={onOpen}
        aria-label={petName}
        className="group relative block aspect-square w-full overflow-hidden rounded-2xl bg-emerald-50 ring-1 ring-zinc-200 transition hover:ring-emerald-300 dark:bg-emerald-900/20 dark:ring-zinc-800"
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            aria-hidden
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PawIcon className="h-16 w-16 text-emerald-600 dark:text-emerald-400" />
          </div>
        )}
      </button>

      {strip.length > 0 && (
        <div className="grid grid-cols-4 gap-1.5">
          {strip.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={onOpen}
              aria-label={`${petName} ${i + 1}`}
              className="aspect-square overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200 transition hover:ring-emerald-400 dark:bg-zinc-800 dark:ring-zinc-700"
            >
              <img
                src={imageUrl(p.cf_image_id, 'public')}
                alt=""
                aria-hidden
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
