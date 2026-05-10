import Link from 'next/link';
import type { Route } from 'next';
import { MusicalNoteIcon } from '@/components/icons/heroicons-shim';
import type { MusicClubRow } from '../../server/clubs.server';

interface Props {
  club: MusicClubRow;
}

/** Reusable hero block + back link, rendered above every club sub-route. Keeps
 *  the visual chrome identical across tabs so the user feels they stay in the
 *  same place. */
export function MusicClubHero({ club }: Props) {
  return (
    <>
      <nav className="text-xs">
        <Link
          href={'/musica/clubes' as Route}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Clubes
        </Link>
      </nav>

      <header className="overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 dark:border-zinc-800 dark:from-amber-900/20 dark:via-zinc-900 dark:to-rose-900/20 sm:p-10">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
          <MusicalNoteIcon className="h-4 w-4" />
          <span>Club · {club.music_genre.replace(/_/g, ' ')}</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
          {club.name}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {club.description}
        </p>
        <p className="mt-3 text-xs text-zinc-500">
          {club.album_count} álbum{club.album_count === 1 ? '' : 'es'} · {club.member_count}{' '}
          miembro{club.member_count === 1 ? '' : 's'}
        </p>
      </header>
    </>
  );
}
