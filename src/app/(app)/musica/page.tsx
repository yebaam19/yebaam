import Link from 'next/link';
import type { Metadata, Route } from 'next';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MusicalNoteIcon,
  PlusIcon,
} from '@/components/icons/heroicons-shim';
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

const COUNTRIES: Array<{ code: string; label: string }> = [
  { code: 'AR', label: 'Argentina' },
  { code: 'BR', label: 'Brasil' },
  { code: 'CL', label: 'Chile' },
  { code: 'CO', label: 'Colombia' },
  { code: 'CU', label: 'Cuba' },
  { code: 'MX', label: 'México' },
  { code: 'PE', label: 'Perú' },
  { code: 'UY', label: 'Uruguay' },
  { code: 'VE', label: 'Venezuela' },
];

const PILL_BASE =
  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors';
const PILL_IDLE =
  'border-zinc-200 bg-white text-zinc-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-amber-700 dark:hover:bg-amber-900/20';
const PILL_ACTIVE =
  'border-amber-500 bg-amber-100 text-amber-800 hover:bg-amber-200 dark:border-amber-600 dark:bg-amber-900/40 dark:text-amber-200';

function pillClass(active: boolean): string {
  return `${PILL_BASE} ${active ? PILL_ACTIVE : PILL_IDLE}`;
}

function TurntableIllustration() {
  return (
    <svg
      viewBox="0 0 320 280"
      className="mx-auto h-auto w-full max-w-[300px] drop-shadow-xl"
      aria-hidden="true"
    >
      {/* Wooden plinth */}
      <defs>
        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7a4a23" />
          <stop offset="55%" stopColor="#5b341a" />
          <stop offset="100%" stopColor="#3a200f" />
        </linearGradient>
        <radialGradient id="vinyl" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <radialGradient id="label" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0c97a" />
          <stop offset="100%" stopColor="#c98a2c" />
        </radialGradient>
      </defs>
      <rect x="10" y="30" width="300" height="220" rx="14" fill="url(#wood)" />
      <rect x="10" y="30" width="300" height="14" rx="14" fill="#2a160a" opacity="0.55" />
      {/* Platter */}
      <circle cx="160" cy="150" r="98" fill="#2a1a10" />
      <circle cx="160" cy="150" r="92" fill="url(#vinyl)" />
      {/* Vinyl grooves */}
      {[88, 80, 72, 64, 56, 48, 40].map((r) => (
        <circle
          key={r}
          cx="160"
          cy="150"
          r={r}
          fill="none"
          stroke="#222"
          strokeWidth="0.6"
          opacity="0.7"
        />
      ))}
      {/* Center label */}
      <circle cx="160" cy="150" r="34" fill="url(#label)" />
      <circle cx="160" cy="150" r="34" fill="none" stroke="#7a4a1a" strokeWidth="1" />
      <circle cx="160" cy="150" r="2.5" fill="#1a0e05" />
      <text
        x="160"
        y="142"
        textAnchor="middle"
        fontSize="6"
        fontFamily="serif"
        fill="#3a200f"
        fontWeight="700"
      >
        ARCHIVO
      </text>
      <text
        x="160"
        y="166"
        textAnchor="middle"
        fontSize="5"
        fontFamily="serif"
        fill="#3a200f"
      >
        MUSICAL
      </text>
      {/* Tonearm */}
      <circle cx="276" cy="78" r="10" fill="#caa667" stroke="#7a5a26" strokeWidth="1" />
      <circle cx="276" cy="78" r="3" fill="#3a2810" />
      <line
        x1="276"
        y1="78"
        x2="208"
        y2="158"
        stroke="#caa667"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <rect x="200" y="152" width="14" height="10" rx="2" fill="#1a1a1a" transform="rotate(-40 207 157)" />
      {/* Speed/control knobs */}
      <circle cx="48" cy="220" r="9" fill="#1a1a1a" stroke="#caa667" strokeWidth="1.2" />
      <circle cx="74" cy="220" r="6" fill="#caa667" />
    </svg>
  );
}

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
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Hero — search-first, with turntable illustration */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6 sm:p-8 lg:p-10 dark:from-amber-900/10 dark:via-zinc-900 dark:to-rose-900/10">
        <div className="grid items-center gap-6 xl:grid-cols-[minmax(0,1fr)_240px] xl:gap-10 2xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-4">
            <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
              <span className="flex items-center gap-2">
                <MusicalNoteIcon className="h-4 w-4" />
                Club de Coleccionistas
              </span>
              <span aria-hidden className="text-zinc-300 dark:text-zinc-700">·</span>
              <Link
                href={'/musica/acerca' as Route}
                className="font-medium normal-case tracking-normal text-zinc-600 hover:text-amber-700 hover:underline dark:text-zinc-300"
              >
                Acerca del Club
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-balance text-zinc-900 sm:text-4xl 2xl:text-5xl dark:text-white">
              Música latinoamericana 1900–1970
            </h1>
            <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
              Encuentra canciones, artistas o álbumes históricos. Reproduce gratis, sin cuenta.
            </p>
            <div className="max-w-xl pt-2">
              <MusicSearchBar size="hero" />
            </div>
            {isAuthed && (
              <p className="pt-1 text-xs text-zinc-500">
                ¿Tienes una digitalización?{' '}
                <Link
                  href={'/musica/subir' as Route}
                  className="font-medium text-amber-700 hover:underline dark:text-amber-400"
                >
                  Súbela al archivo
                </Link>
              </p>
            )}
          </div>
          <div className="hidden xl:block">
            <TurntableIllustration />
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{heading}</h2>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>
              {albums.length} {albums.length === 1 ? 'álbum' : 'álbumes'}
            </span>
            <Link
              href={'/musica' as Route}
              className="font-medium text-zinc-600 hover:text-amber-700 hover:underline dark:text-zinc-300"
            >
              Ver todos
            </Link>
            <div className="flex items-center gap-1">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </span>
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </span>
            </div>
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
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Clubes de coleccionistas
            </h2>
            <Link
              href={'/musica/clubes' as Route}
              className="text-xs font-medium text-zinc-600 hover:text-amber-700 hover:underline dark:text-zinc-300"
            >
              Ver todos los clubes →
            </Link>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Cada género es un club independiente. Únete y explora discos de salsa, tango, bolero,
            mambo y más.
          </p>
          <MusicClubsGrid clubs={clubs} limit={8} />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Explorar por década</h2>
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Intercambio</h2>
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Explorar por género
        </h2>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => {
            const active = genreSlug === g.slug;
            return (
              <Link
                key={g.id}
                href={buildHref({
                  decade,
                  country,
                  forTrade,
                  genre: active ? undefined : g.slug,
                  condition: conditionValue,
                })}
                className={pillClass(active)}
                aria-pressed={active}
              >
                {g.name}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Estado de conservación
        </h2>
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Explorar por país</h2>
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
