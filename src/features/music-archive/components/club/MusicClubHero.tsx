'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { MusicalNoteIcon } from '@/components/icons/heroicons-shim';
import { resolveImageRef } from '@/lib/media/urls';
import type { MusicClubRow } from '../../server/clubs.server';

interface Props {
  club: MusicClubRow;
}

/** Reusable hero block + back link, rendered above every club sub-route. Keeps
 *  the visual chrome identical across tabs so the user feels they stay in the
 *  same place. When the admin has uploaded a banner it fills the hero; otherwise
 *  we fall back to the original pastel gradient. `cover_image_url` holds a bare
 *  Cloudflare image id on new rows but a full URL on legacy ones —
 *  resolveImageRef renders both. */
export function MusicClubHero({ club }: Props) {
  const t = useTranslations('musica');
  const bannerUrl = resolveImageRef(club.cover_image_url, 'hero');

  return (
    <>
      <nav className="text-xs">
        <Link
          href={'/musica/clubes' as Route}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {t('clubs.createBack')}
        </Link>
      </nav>

      <header className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 sm:min-h-[260px]">
        {bannerUrl ? (
          <>
            <div
              aria-hidden
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${bannerUrl})` }}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/10"
            />
          </>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-900/20 dark:via-zinc-900 dark:to-rose-900/20"
          />
        )}
        <div className="relative p-6 sm:p-10">
          <div
            className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wide ${
              bannerUrl ? 'text-amber-200' : 'text-amber-700 dark:text-amber-400'
            }`}
          >
            <MusicalNoteIcon className="h-4 w-4" />
            <span>Club · {club.genre_name}</span>
          </div>
          <h1
            className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${
              bannerUrl ? 'text-white drop-shadow' : 'text-zinc-900 dark:text-white'
            }`}
          >
            {club.name}
          </h1>
          <p
            className={`mt-3 max-w-3xl text-sm leading-relaxed ${
              bannerUrl ? 'text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {club.description}
          </p>
          <p className={`mt-3 text-xs ${bannerUrl ? 'text-zinc-200' : 'text-zinc-500'}`}>
            {t('club.albumsCount', { count: club.album_count })} · {t('club.membersCount', { count: club.member_count })}
          </p>
        </div>
      </header>
    </>
  );
}
