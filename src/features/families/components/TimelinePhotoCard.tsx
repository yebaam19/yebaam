import { imageUrl } from '@/lib/media/urls';
import type { FamilyPhotoRow } from '../types/family.types';
import { PersonChipList } from './PersonAvatarChip';

export function TimelinePhotoCard({ photo }: { photo: FamilyPhotoRow }) {
  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <a
        href={imageUrl(photo.cf_image_id, 'public')}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-zinc-100 dark:bg-zinc-950"
      >
        <img
          src={imageUrl(photo.cf_image_id, 'public')}
          alt={photo.caption ?? ''}
          className="max-h-[480px] w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </a>
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Foto</span>
        </div>
        {photo.caption && (
          <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">{photo.caption}</p>
        )}
        {photo.tagged_persons && photo.tagged_persons.length > 0 && (
          <div className="mt-3">
            <PersonChipList persons={photo.tagged_persons} />
          </div>
        )}
      </div>
    </article>
  );
}
