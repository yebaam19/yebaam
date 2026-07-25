'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { imageUrl } from '@/lib/media/urls';
import { MusicalNoteIcon } from '@/components/icons/heroicons-shim';

interface Artist {
  id: string;
  name: string;
  slug: string;
  photo_cf_image_id: string | null;
  album_count: number;
}

interface Props {
  artists: Artist[];
}

/** Grid of every artist with ≥1 album tagged into the club. Click → artist
 *  detail page where bio + discography + articles live. */
export function ClubArtistsList({ artists }: Props) {
  const t = useTranslations('musica');
  if (artists.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
        {t('club.artists.empty')}
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {artists.map((a) => {
        const photo = a.photo_cf_image_id ? imageUrl(a.photo_cf_image_id, 'avatar') : null;
        return (
          <li key={a.id}>
            <Link
              href={`/musica/artistas/${a.slug}` as Route}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
            >
              <div className="h-12 w-12 flex-none overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                {photo ? (
                  <img src={photo} alt={a.name} className="h-full w-full object-cover" decoding="async" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <MusicalNoteIcon className="h-5 w-5 text-zinc-400" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {a.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {t('club.albumsCount', { count: a.album_count })}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
