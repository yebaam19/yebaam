import Link from 'next/link';
import type { Route } from 'next';
import { MusicalNoteIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import type { MusicAlbumRow } from '../types/music.types';

interface Props {
  album: MusicAlbumRow;
  artistName?: string;
}

export function AlbumCoverCard({ album, artistName }: Props) {
  const cover = album.cover_cf_image_id ? imageUrl(album.cover_cf_image_id, 'thumbnail') : null;
  return (
    <Link
      href={`/musica/albumes/${album.slug}` as Route}
      className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
        {cover ? (
          <img
            src={cover}
            alt={`Carátula: ${album.title}`}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <MusicalNoteIcon className="h-10 w-10 text-zinc-400" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {album.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {artistName ? `${artistName} · ` : ''}
          {album.year ?? '—'}
          {album.country ? ` · ${album.country}` : ''}
        </p>
      </div>
    </Link>
  );
}
