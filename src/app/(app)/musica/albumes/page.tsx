import Link from 'next/link';
import type { Metadata, Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { MusicalNoteIcon } from '@/components/icons/heroicons-shim';
import {
  getArtistNamesByIds,
  listAlbumsPage,
} from '@/features/music-archive/server/music.server';
import { AlbumCoverCard } from '@/features/music-archive/components/AlbumCoverCard';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('musica');
  return {
    title: t('albumsIndex.metaTitle'),
    description: t('albumsIndex.metaDescription'),
  };
}

function pageHref(page: number): Route {
  return (page <= 1 ? '/musica/albumes' : `/musica/albumes?page=${page}`) as Route;
}

export default async function AllAlbumsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const t = await getTranslations('musica');

  const requestedPage = Number.parseInt(sp.page ?? '1', 10);
  const { albums, total, page, pageCount } = await listAlbumsPage(
    Number.isNaN(requestedPage) ? 1 : requestedPage,
  );
  const artistsById = await getArtistNamesByIds(albums.map((a) => a.artist_id));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <header className="space-y-2 border-b border-zinc-200/80 pb-6 dark:border-zinc-800/80">
        <Link
          href={'/musica' as Route}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {t('albumsIndex.backToArchive')}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {t('albumsIndex.title')}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('albumsIndex.subtitle')}</p>
      </header>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('landing.albumsCount', { count: total })}
          </span>
          {pageCount > 1 && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {t('albumsIndex.pageOf', { page, pageCount })}
            </span>
          )}
        </div>

        {albums.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <MusicalNoteIcon className="mx-auto h-10 w-10 text-zinc-400" />
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              {t('albumsIndex.empty')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {albums.map((a) => (
              <AlbumCoverCard key={a.id} album={a} artistName={artistsById.get(a.artist_id)} />
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <nav
            aria-label={t('albumsIndex.paginationAriaLabel')}
            className="flex items-center justify-between border-t border-zinc-200/80 pt-4 text-sm dark:border-zinc-800/80"
          >
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="font-medium text-zinc-700 hover:underline dark:text-zinc-300"
              >
                {t('albumsIndex.prev')}
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
            {page < pageCount ? (
              <Link
                href={pageHref(page + 1)}
                className="font-medium text-zinc-700 hover:underline dark:text-zinc-300"
              >
                {t('albumsIndex.next')}
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
