'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';

interface Club {
  id: string;
  name: string;
  slug: string;
  is_primary: boolean;
}

/** Small chip row below the album metadata showing the genre clubs an album
 *  belongs to. Primary club rendered with a star icon. Client component so it
 *  can read translations via `useTranslations`. */
export function AlbumGenreTags({ clubs }: { clubs: Club[] }) {
  const t = useTranslations('musica');
  if (clubs.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-zinc-500">{t('genreTags.label')}</span>
      {clubs.map((c) => (
        <Link
          key={c.id}
          href={`/musica/clubes/${c.slug}` as Route}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
            c.is_primary
              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300'
              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
          }`}
          title={c.is_primary ? t('genreTags.primaryTitle') : undefined}
        >
          {c.is_primary && <span aria-hidden>★</span>}
          {c.name}
        </Link>
      ))}
    </div>
  );
}
