import Link from 'next/link';
import type { Metadata, Route } from 'next';
import { MusicalNoteIcon, PlusIcon } from '@/components/icons/heroicons-shim';
import {
  listAlbumsFiltered,
  listLatestAlbums,
} from '@/features/music-archive/server/music.server';
import { listMusicClubs } from '@/features/music-archive/server/clubs.server';
import { listLatestMusicMedia } from '@/features/music-archive/server/music-media.server';
import { listMusicGenres } from '@/features/music-archive/server/genres.server';
import { AlbumCoverCard } from '@/features/music-archive/components/AlbumCoverCard';
import { MusicSearchBar } from '@/features/music-archive/components/MusicSearchBar';
import { MusicClubsGrid } from '@/features/music-archive/components/MusicClubsGrid';
import { MusicMediaSmartFeed } from '@/features/music-archive/components/media/MusicMediaSmartFeed';
import { GenreBrowser } from '@/features/music-archive/components/genre/GenreBrowser';
import { pillClass } from '@/features/music-archive/lib/pill-class';
import { MUSIC_ARCHIVE_PUBLIC_COUNTRY_FILTERS as COUNTRIES } from '@/features/music-archive/components/upload/constants';
import { ALBUM_CONDITION_LABELS, type AlbumCondition } from '@/features/music-archive/types/music.types';
import { getServerClient } from '@/utils/supabase/server';

export const metadata: Metadata = {
  title: 'Archivo Musical Latinoamericano 1900–1970',
  description:
    'Busca y escucha música histórica de Latinoamérica: 78rpm, vinilos y singles de los 30, 40, 50 y 60. Cualquiera puede escuchar; los coleccionistas suben.',
};

const DECADES: Array<{ start: number; label: string }> = [
  { start: 1900, label: '1900s' },
  { start: 1910, label: '1910s' },
  { start: 1920, label: '1920s' },
  { start: 1930, label: '1930s' },
  { start: 1940, label: '1940s' },
  { start: 1950, label: '1950s' },
  { start: 1960, label: '1960s' },
  { start: 1970, label: '1970s' },
];

function buildHref(opts: {
  decade?: number;
  country?: string;
  forTrade?: boolean;
  genre?: string;
  condition?: string;
}): Route {
  const params = new URLSearchParams();
  if (opts.decade !== undefined) params.set('decade', String(opts.decade));
  if (opts.country) params.set('country', opts.country);
  if (opts.forTrade) params.set('trade', '1');
  if (opts.genre) params.set('genre', opts.genre);
  if (opts.condition) params.set('condition', opts.condition);
  const qs = params.toString();
  return (qs ? `/musica?${qs}` : '/musica') as Route;
}

function filteredHeading(
  decade: number | undefined,
  country: string | undefined,
  forTrade: boolean,
  genreName: string | null,
  conditionLabel: string | null,
): string {
  const decadeLabel = decade !== undefined ? `los ${decade}s` : null;
  const countryLabel = country
    ? COUNTRIES.find((c) => c.code === country)?.label ?? country
    : null;
  const parts: string[] = [];
  if (genreName) parts.push(`de ${genreName.toLowerCase()}`);
  if (decadeLabel) parts.push(`de ${decadeLabel}`);
  if (countryLabel) parts.push(`en ${countryLabel}`);
  if (forTrade) parts.push('para intercambio');
  if (conditionLabel) parts.push(`en estado ${conditionLabel}`);
  if (parts.length === 0) return 'Subidos recientemente';
  return `Álbumes ${parts.join(' ')}`;
}

export default async function MusicArchiveLandingPage({
  searchParams,
}: {
  searchParams: Promise<{
    decade?: string;
    country?: string;
    trade?: string;
    genre?: string;
    condition?: string;
  }>;
}) {
  const sp = await searchParams;

  const decadeNum = Number(sp.decade);
  const decade = DECADES.some((d) => d.start === decadeNum) ? decadeNum : undefined;
  const countryCode = (sp.country ?? '').toUpperCase();
  const country = COUNTRIES.some((c) => c.code === countryCode) ? countryCode : undefined;
  const forTrade = sp.trade === '1';
  const genreSlug = sp.genre?.trim() || undefined;
  const conditionValue =
    sp.condition && sp.condition in ALBUM_CONDITION_LABELS ? (sp.condition as AlbumCondition) : undefined;

  const isFiltered =
    decade !== undefined || country !== undefined || forTrade || !!genreSlug || !!conditionValue;

  const [albums, client, clubs, media, genres] = await Promise.all([
    isFiltered
      ? listAlbumsFiltered({
          decade,
          country,
          forTrade,
          genreSlug,
          condition: conditionValue,
          limit: 60,
        })
      : listLatestAlbums(24),
    getServerClient(),
    listMusicClubs(),
    listLatestMusicMedia(12),
    listMusicGenres(),
  ]);
  const genreName = genreSlug ? genres.find((g) => g.slug === genreSlug)?.name ?? null : null;
  const conditionLabel = conditionValue ? ALBUM_CONDITION_LABELS[conditionValue] : null;
  const { data: userData } = await client.auth.getUser();
  const isAuthed = Boolean(userData.user);

  const artistIds = Array.from(new Set(albums.map((a) => a.artist_id)));
  const artistsById = new Map<string, string>();
  if (artistIds.length > 0) {
    const { data } = await client.from('music_artists').select('id, name').in('id', artistIds);
    for (const a of (data ?? []) as Array<{ id: string; name: string }>) {
      artistsById.set(a.id, a.name);
    }
  }

  const heading = filteredHeading(decade, country, forTrade, genreName, conditionLabel);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <header className="max-w-2xl border-b border-zinc-200/80 pb-8 dark:border-zinc-800/80">
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Club de Coleccionistas</p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100">
            Música latinoamericana 1900–1970
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Busca álbumes y artistas. Escucha sin crear cuenta.
          </p>
          <div className="max-w-xl pt-1">
            <MusicSearchBar size="hero" />
          </div>
          {isAuthed && (
            <p className="pt-1 text-xs text-zinc-500 dark:text-zinc-400">
              <Link
                href={'/musica/subir' as Route}
                className="font-medium text-zinc-800 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500 dark:text-zinc-200 dark:decoration-zinc-600 dark:hover:decoration-zinc-400"
              >
                Subir una digitalización
              </Link>
            </p>
          )}
        </div>
      </header>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">{heading}</h2>
          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              {albums.length} {albums.length === 1 ? 'álbum' : 'álbumes'}
            </span>
            {isFiltered && (
              <Link
                href={'/musica' as Route}
                className="font-medium text-zinc-700 hover:underline dark:text-zinc-300"
              >
                Quitar filtros
              </Link>
            )}
          </div>
        </div>
        {albums.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <MusicalNoteIcon className="mx-auto h-10 w-10 text-zinc-400" />
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              {isFiltered
                ? 'Sin álbumes para este filtro.'
                : 'Aún no hay álbumes en el archivo.'}
            </p>
            {isFiltered ? (
              <Link
                href={'/musica' as Route}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              >
                Ver todos los álbumes
              </Link>
            ) : (
              isAuthed && (
                <Link
                  href={'/musica/subir' as Route}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  <PlusIcon className="h-4 w-4" />
                  Sube el primero
                </Link>
              )
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {albums.map((a) => (
              <AlbumCoverCard
                key={a.id}
                album={a}
                artistName={artistsById.get(a.artist_id)}
              />
            ))}
          </div>
        )}
      </section>

      {media.length > 0 && <MusicMediaSmartFeed items={media} />}

      {clubs.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">Clubes</h2>
            <Link
              href={'/musica/clubes' as Route}
              className="text-xs font-medium text-zinc-600 hover:underline dark:text-zinc-400"
            >
              Ver todos
            </Link>
          </div>
          <MusicClubsGrid clubs={clubs} limit={8} />
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">Década</h2>
        <div className="flex flex-wrap gap-2">
          {DECADES.map((d) => {
            const active = decade === d.start;
            return (
              <Link
                key={d.start}
                href={buildHref({
                  decade: active ? undefined : d.start,
                  country,
                  forTrade,
                  genre: genreSlug,
                  condition: conditionValue,
                })}
                className={pillClass(active)}
                aria-pressed={active}
              >
                {d.label}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">Intercambio</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildHref({
              decade,
              country,
              forTrade: !forTrade,
              genre: genreSlug,
              condition: conditionValue,
            })}
            className={pillClass(forTrade)}
            aria-pressed={forTrade}
          >
            Solo disponibles para intercambio
          </Link>
        </div>
      </section>

      <GenreBrowser
        genres={genres}
        activeSlug={genreSlug}
        currentParams={{ decade, country, forTrade, condition: conditionValue }}
      />

      <section className="space-y-2">
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">Conservación</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ALBUM_CONDITION_LABELS) as AlbumCondition[]).map((c) => {
            const active = conditionValue === c;
            return (
              <Link
                key={c}
                href={buildHref({
                  decade,
                  country,
                  forTrade,
                  genre: genreSlug,
                  condition: active ? undefined : c,
                })}
                className={pillClass(active)}
                aria-pressed={active}
              >
                {ALBUM_CONDITION_LABELS[c]}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">País</h2>
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map((c) => {
            const active = country === c.code;
            return (
              <Link
                key={c.code}
                href={buildHref({
                  decade,
                  country: active ? undefined : c.code,
                  forTrade,
                  genre: genreSlug,
                  condition: conditionValue,
                })}
                className={pillClass(active)}
                aria-pressed={active}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
