import Link from 'next/link';
import type { Metadata, Route } from 'next';
import { MusicalNoteIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import { searchMusic } from '@/features/music-archive/server/music.server';
import { MusicSearchBar } from '@/features/music-archive/components/MusicSearchBar';
import { AlbumCoverCard } from '@/features/music-archive/components/AlbumCoverCard';

export const metadata: Metadata = {
  title: 'Buscar — Archivo Musical',
};

export default async function MusicSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();
  const result = await searchMusic(q, 30);
  const totalHits = result.artists.length + result.albums.length + result.tracks.length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <nav className="text-xs">
        <Link
          href={'/musica' as Route}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Archivo Musical
        </Link>
      </nav>

      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Buscar en el archivo
        </h1>
        <MusicSearchBar initialValue={q} size="hero" />
        {q && (
          <p className="text-xs text-zinc-500">
            {totalHits} {totalHits === 1 ? 'resultado' : 'resultados'} para «{q}»
          </p>
        )}
      </div>

      {!q ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40">
          Escribe al menos 2 letras para empezar a buscar.
        </div>
      ) : totalHits === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
          <MusicalNoteIcon className="mx-auto h-9 w-9 text-zinc-400" />
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Sin resultados para «{q}». Prueba con otro término.
          </p>
        </div>
      ) : (
        <>
          {result.tracks.length > 0 && (
            <section>
              <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Canciones ({result.tracks.length})
              </h2>
              <ul className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                {result.tracks.map((t) => {
                  const cover = t.album_cover_cf_image_id
                    ? imageUrl(t.album_cover_cf_image_id, 'avatar')
                    : null;
                  return (
                    <li key={t.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                      <Link
                        href={`/musica/albumes/${t.album_slug}` as Route}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                          {cover ? (
                            <img src={cover} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <MusicalNoteIcon className="h-4 w-4 text-zinc-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {t.title}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {t.artist_name} · {t.album_title}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {result.albums.length > 0 && (
            <section>
              <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Álbumes ({result.albums.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {result.albums.map((a) => (
                  <AlbumCoverCard key={a.id} album={a} />
                ))}
              </div>
            </section>
          )}

          {result.artists.length > 0 && (
            <section>
              <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Artistas ({result.artists.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {result.artists.map((a) => (
                  <Link
                    key={a.id}
                    href={`/musica/artistas/${a.slug}` as Route}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-amber-700 dark:hover:bg-amber-900/20"
                  >
                    {a.name}
                    {a.country && (
                      <span className="text-xs text-zinc-400">{a.country}</span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
