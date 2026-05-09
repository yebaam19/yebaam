import { PhotoIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import type { FamilyPhotoRow } from '../types/family.types';

export function FamilyPhotosGrid({ photos }: { photos: FamilyPhotoRow[] }) {
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
        <PhotoIcon className="h-10 w-10 text-zinc-400" />
        <h3 className="mt-3 text-base font-semibold text-zinc-800 dark:text-zinc-100">
          Aún no hay fotos
        </h3>
        <p className="mt-1 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          Sube fotos de familiares vivos o fallecidos. Usa la fecha para que aparezcan en la línea de tiempo.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((p) => (
        <figure
          key={p.id}
          className="group overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        >
          <a
            href={imageUrl(p.cf_image_id, 'public')}
            target="_blank"
            rel="noopener"
            className="block"
          >
            <img
              src={imageUrl(p.cf_image_id, 'public')}
              alt={p.caption ?? 'Foto familiar'}
              className="aspect-square w-full object-cover transition group-hover:scale-[1.02]"
              loading="lazy"
            />
          </a>
          <figcaption className="p-2">
            {p.caption && (
              <p className="line-clamp-2 text-xs text-zinc-700 dark:text-zinc-300">{p.caption}</p>
            )}
            {p.taken_at && (
              <p className="mt-0.5 text-[10px] text-zinc-500">
                {new Date(p.taken_at).toLocaleDateString('es', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
