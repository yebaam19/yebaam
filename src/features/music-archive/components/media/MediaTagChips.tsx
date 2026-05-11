'use client';

import Link from 'next/link';
import type { Route } from 'next';
import type {
  MusicMediaAlbumRef,
  MusicMediaArtistRef,
  MusicMediaClubRef,
} from '../../types/music-media.types';

interface Props {
  artists: MusicMediaArtistRef[];
  albums: MusicMediaAlbumRef[];
  clubs: MusicMediaClubRef[];
  /** Compact mode renders chips inline without group labels — used in feed cards. */
  compact?: boolean;
}

export function MediaTagChips({ artists, albums, clubs, compact = false }: Props) {
  const hasAny = artists.length > 0 || albums.length > 0 || clubs.length > 0;
  if (!hasAny) return null;

  if (compact) {
    return (
      <ul className="flex flex-wrap gap-1.5">
        {artists.map((a) => (
          <li key={`a-${a.id}`}>
            <Link href={`/musica/artistas/${a.slug}` as Route} className={chipClass('artist')}>
              {a.name}
            </Link>
          </li>
        ))}
        {albums.map((a) => (
          <li key={`l-${a.id}`}>
            <Link href={`/musica/albumes/${a.slug}` as Route} className={chipClass('album')}>
              {a.title}
            </Link>
          </li>
        ))}
        {clubs.map((c) => (
          <li key={`c-${c.id}`}>
            <Link href={`/musica/clubes/${c.slug}` as Route} className={chipClass('club')}>
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-3">
      {artists.length > 0 && (
        <Group label="Artistas etiquetados">
          {artists.map((a) => (
            <li key={a.id}>
              <Link href={`/musica/artistas/${a.slug}` as Route} className={chipClass('artist')}>
                {a.name}
              </Link>
            </li>
          ))}
        </Group>
      )}
      {albums.length > 0 && (
        <Group label="Álbum">
          {albums.map((a) => (
            <li key={a.id}>
              <Link href={`/musica/albumes/${a.slug}` as Route} className={chipClass('album')}>
                {a.title}
              </Link>
            </li>
          ))}
        </Group>
      )}
      {clubs.length > 0 && (
        <Group label="Club">
          {clubs.map((c) => (
            <li key={c.id}>
              <Link href={`/musica/clubes/${c.slug}` as Route} className={chipClass('club')}>
                {c.name}
              </Link>
            </li>
          ))}
        </Group>
      )}
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <ul className="mt-1 flex flex-wrap gap-1.5">{children}</ul>
    </div>
  );
}

function chipClass(variant: 'artist' | 'album' | 'club'): string {
  const base = 'inline-flex rounded-full border px-2.5 py-1 text-xs transition';
  if (variant === 'artist') {
    return `${base} border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200`;
  }
  if (variant === 'album') {
    return `${base} border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200`;
  }
  return `${base} border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200`;
}
