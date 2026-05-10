import Link from 'next/link';
import type { Route } from 'next';
import type { MusicClubRow } from '../server/clubs.server';

interface Props {
  clubs: MusicClubRow[];
  /** Cap visible entries; the rest collapse behind a "Ver todos" link. */
  limit?: number;
}

/** Card grid of genre-clubs. Reused on `/musica` (capped to 8 with "Ver todos"
 *  link) and `/musica/clubes` (full grid). Each card is a link to the genre
 *  detail page. */
export function MusicClubsGrid({ clubs, limit }: Props) {
  const visible = limit ? clubs.slice(0, limit) : clubs;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {visible.map((c) => (
        <Link
          key={c.id}
          href={`/musica/clubes/${c.slug}` as Route}
          className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:border-amber-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-amber-700"
        >
          <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 dark:from-amber-900/40 dark:via-zinc-800 dark:to-rose-900/40">
            {c.cover_image_url ? (
              <img
                src={c.cover_image_url}
                alt={`Club ${c.name}`}
                className="h-full w-full object-cover transition group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-serif text-3xl font-bold text-amber-700/70 dark:text-amber-400/70">
                  {c.name.slice(0, 1)}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col px-3 py-2">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {c.name}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {c.album_count} álbum{c.album_count === 1 ? '' : 'es'}
              {c.member_count > 0 && ` · ${c.member_count} miembro${c.member_count === 1 ? '' : 's'}`}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
