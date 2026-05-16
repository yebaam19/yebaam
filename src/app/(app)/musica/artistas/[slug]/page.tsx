import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata, Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { MusicalNoteIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import { getArtistBySlug } from '@/features/music-archive/server/music.server';
import {
  listArticlesForArtist,
  listClubsForArtist,
} from '@/features/music-archive/server/music-articles.server';
import { listMusicMediaForArtist } from '@/features/music-archive/server/music-media.server';
import { AlbumCoverCard } from '@/features/music-archive/components/AlbumCoverCard';
import { MusicArticleCard } from '@/features/music-archive/components/club/MusicArticleCard';
import { MusicMediaGrid } from '@/features/music-archive/components/media/MusicMediaGrid';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations('musica');
  const artist = await getArtistBySlug(slug);
  if (!artist) return { title: t('artist.notFound') };
  const lifespan = artist.born_year ? ` (${artist.born_year}–${artist.died_year ?? ''})` : '';
  return {
    title: artist.name,
    description: t('artist.metaDescription', {
      name: artist.name,
      lifespan,
      count: artist.albums.length,
    }),
  };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();
  const t = await getTranslations('musica');
  const [articles, clubs, media] = await Promise.all([
    listArticlesForArtist(artist.id),
    listClubsForArtist(artist.id),
    listMusicMediaForArtist(artist.id, 60),
  ]);

  const photo = artist.photo_cf_image_id ? imageUrl(artist.photo_cf_image_id, 'public') : null;
  const lifeSpan =
    artist.born_year || artist.died_year
      ? `${artist.born_year ?? '?'}–${artist.died_year ?? ''}`
      : null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <nav className="text-xs">
        <Link
          href={'/musica' as Route}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {t('search.backToArchive')}
        </Link>
      </nav>

      <header className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
          {photo ? (
            <img
              src={photo}
              alt={artist.name}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center">
              <MusicalNoteIcon className="h-12 w-12 text-zinc-400" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{artist.name}</h1>
          <p className="text-sm text-zinc-500">
            {[artist.country, lifeSpan].filter(Boolean).join(' · ')}
          </p>
          {artist.bio_short && (
            <p className="pt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {artist.bio_short}
            </p>
          )}
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('artist.discographyHeading')}</h2>
          <span className="text-xs text-zinc-500">
            {t('artist.albumsCount', { count: artist.albums.length })}
          </span>
        </div>
        {artist.albums.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
            {t('artist.emptyAlbums')}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {artist.albums.map((album) => (
              <AlbumCoverCard key={album.id} album={album} artistName={artist.name} />
            ))}
          </div>
        )}
      </section>

      {media.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {t('artist.photosVideosHeading')}
          </h2>
          <MusicMediaGrid items={media} />
        </section>
      )}

      {clubs.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {t('artist.clubsHeading')}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {clubs.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/musica/clubes/${c.slug}` as Route}
                  className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t('artist.articlesHeading', { name: artist.name })}
        </h2>
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) =>
              a.club ? (
                <MusicArticleCard key={a.id} article={a} clubSlug={a.club.slug} />
              ) : null,
            )}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
            {t('artist.emptyArticles', { name: artist.name })}
          </p>
        )}
      </section>
    </div>
  );
}
