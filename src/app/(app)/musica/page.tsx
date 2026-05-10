import Link from 'next/link';
import type { Metadata, Route } from 'next';
import { MusicalNoteIcon, PlusIcon } from '@/components/icons/heroicons-shim';
import {
  listAlbumsFiltered,
  listLatestAlbums,
} from '@/features/music-archive/server/music.server';
import { AlbumCoverCard } from '@/features/music-archive/components/AlbumCoverCard';
import { MusicSearchBar } from '@/features/music-archive/components/MusicSearchBar';
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

function buildHref(opts: { decade?: number; country?: string }): Route {
  const params = new URLSearchParams();
  if (opts.decade !== undefined) params.set('decade', String(opts.decade));
  if (opts.country) params.set('country', opts.country);
  const qs = params.toString();
  return (qs ? `/musica?${qs}` : '/musica') as Route;
}

function filteredHeading(decade: number | undefined, country: string | undefined): string {
  const decadeLabel = decade !== undefined ? `los ${decade}s` : null;
  const countryLabel = country
    ? COUNTRIES.find((c) => c.code === country)?.label ?? country
    : null;
  if (decadeLabel && countryLabel) return `Álbumes de ${decadeLabel} en ${countryLabel}`;
  if (decadeLabel) return `Álbumes de ${decadeLabel}`;
  if (countryLabel) return `Álbumes de ${countryLabel}`;
  return 'Subidos recientemente';
}

export default async function MusicArchiveLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ decade?: string; country?: string }>;
}) {
  const sp = await searchParams;

  const decadeNum = Number(sp.decade);
  const decade = DECADES.some((d) => d.start === decadeNum) ? decadeNum : undefined;
  const countryCode = (sp.country ?? '').toUpperCase();
  const country = COUNTRIES.some((c) => c.code === countryCode) ? countryCode : undefined;
  const isFiltered = decade !== undefined || country !== undefined;

  const [albums, client] = await Promise.all([
    isFiltered
      ? listAlbumsFiltered({ decade, country, limit: 60 })
      : listLatestAlbums(24),
    getServerClient(),
  ]);
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

  const heading = filteredHeading(decade, country);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Hero — search-first */}
      <header className="space-y-4 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6 sm:p-10 dark:from-amber-900/10 dark:via-zinc-900 dark:to-rose-900/10">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
          <MusicalNoteIcon className="h-4 w-4" />
          <span>Archivo Musical</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
          Música latinoamericana 1900–1970
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Encuentra canciones, artistas o álbumes históricos. Reproduce gratis, sin cuenta.
        </p>
        <div className="max-w-2xl pt-2">
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
      </header>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{heading}</h2>
          <div className="flex items-baseline gap-3 text-xs text-zinc-500">
            <span>
              {albums.length} {albums.length === 1 ? 'álbum' : 'álbumes'}
            </span>
            {isFiltered && (
              <Link
                href={'/musica' as Route}
                className="font-medium text-amber-700 hover:underline dark:text-amber-400"
              >
                Ver todos
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Por década</h2>
        <div className="flex flex-wrap gap-2">
          {DECADES.map((d) => {
            const active = decade === d.start;
            return (
              <Link
                key={d.start}
                href={buildHref({ decade: active ? undefined : d.start, country })}
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
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Por país</h2>
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map((c) => {
            const active = country === c.code;
            return (
              <Link
                key={c.code}
                href={buildHref({ decade, country: active ? undefined : c.code })}
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
