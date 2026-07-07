import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata, Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { MusicalNoteIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import { getPublicAudioUrl } from '@/lib/cloudflare/r2';
import { getAlbumBySlug } from '@/features/music-archive/server/music.server';
import { listClubsForAlbum } from '@/features/music-archive/server/clubs.server';
import { getAlbumReactionCounts } from '@/features/music-archive/server/music-reactions.server';
import { listMusicMediaForAlbum } from '@/features/music-archive/server/music-media.server';
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';
import { AlbumTracklist } from '@/features/music-archive/components/AlbumTracklist';
import { AlbumNotes } from '@/features/music-archive/components/AlbumNotes';
import { AlbumGenreTags } from '@/features/music-archive/components/AlbumGenreTags';
import { AlbumMetaField } from '@/features/music-archive/components/AlbumMetaField';
import { AlbumCoverHero } from '@/features/music-archive/components/AlbumCoverHero';
import { AlbumExtraImages } from '@/features/music-archive/components/AlbumExtraImages';
import { AlbumReactionsBar } from '@/features/music-archive/components/club/AlbumReactionsBar';
import { MusicMediaGrid } from '@/features/music-archive/components/media/MusicMediaGrid';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations('musica');
  const album = await getAlbumBySlug(slug);
  if (!album) return { title: t('album.notFound') };
  const yearPart = album.year ? t('album.metaYear', { year: album.year }) : '';
  return {
    title: `${album.title} — ${album.artist.name}`,
    description: t('album.metaDescription', {
      title: album.title,
      artist: album.artist.name,
      year: yearPart,
      trackCount: album.tracks.length,
    }),
    ...(album.cover_cf_image_id
      ? { openGraph: { images: [imageUrl(album.cover_cf_image_id, 'public')] } }
      : {}),
  };
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);
  if (!album) notFound();
  const t = await getTranslations('musica');

  // Pre-sign R2 URLs for every track in parallel. The TTL is 1h which is
  // plenty for a single page session. Kicked off before the Promise.all below
  // (its only input is album.tracks) so the fan-out overlaps the other reads.
  const audioEntriesPromise = Promise.all(
    album.tracks.map(async (track) => {
      try {
        const url = await getPublicAudioUrl(track.r2_key, 3600);
        return [track.id, url] as const;
      } catch (err) {
        console.error('[album page] R2 presign failed', { trackId: track.id, r2Key: track.r2_key, err: err instanceof Error ? err.message : err });
        return [track.id, ''] as const;
      }
    }),
  );

  const [clubs, reactions, authUser, media, audioEntries] = await Promise.all([
    listClubsForAlbum(album.id),
    getAlbumReactionCounts(album.id),
    getCachedAuthUser(),
    listMusicMediaForAlbum(album.id),
    audioEntriesPromise,
  ]);
  const signedIn = Boolean(authUser);

  const audioUrlByTrackId = Object.fromEntries(
    audioEntries.filter(([, url]) => url !== ''),
  ) as Record<string, string>;

  const albumJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: album.title,
    byArtist: { '@type': 'MusicGroup', name: album.artist.name },
    ...(album.year ? { datePublished: String(album.year) } : {}),
    numTracks: album.tracks.length,
    track: album.tracks.map((track) => ({
      '@type': 'MusicRecording',
      name: track.title,
    })),
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Titles are user content — escape "<" so a "</script>" inside a string
          can't terminate the tag. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(albumJsonLd).replace(/</g, '\\u003c') }}
      />
      <nav className="text-xs">
        <Link
          href={'/musica' as Route}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {t('search.backToArchive')}
        </Link>
      </nav>

      {/* Hero — cover + title + scalar metadata. Notes deliberately live in
          their own full-width block below so they don't squeeze this row. */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[minmax(200px,280px)_1fr] sm:gap-8">
        <div className="mx-auto w-full max-w-xs overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 sm:mx-0 sm:max-w-none">
          {album.cover_cf_image_id ? (
            <AlbumCoverHero coverCfImageId={album.cover_cf_image_id} title={album.title} />
          ) : (
            <div className="flex aspect-square items-center justify-center">
              <MusicalNoteIcon className="h-16 w-16 text-zinc-400" />
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-100">
            {album.title}
          </h1>
          <Link
            href={`/musica/artistas/${album.artist.slug}` as Route}
            className="inline-block text-base font-medium text-amber-700 hover:underline dark:text-amber-400"
          >
            {album.artist.name}
          </Link>
          {album.accompaniment && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="text-zinc-400">{t('album.accompaniment')}</span> {album.accompaniment}
            </p>
          )}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2 text-sm sm:grid-cols-3">
            {album.year ? (
              <AlbumMetaField label={t('album.year')} value={String(album.year)} />
            ) : album.decade ? (
              <AlbumMetaField label={t('album.decade')} value={t('album.decadeValue', { decade: album.decade })} />
            ) : null}
            {album.country && (
              <AlbumMetaField
                label={t('album.country')}
                value={t.has(`countries.${album.country}`) ? t(`countries.${album.country}`) : album.country}
              />
            )}
            <AlbumMetaField
              label={t('album.format')}
              value={t.has(`formats.${album.format}`) ? t(`formats.${album.format}`) : album.format}
            />
            {album.label && (
              <AlbumMetaField
                label={t('album.labelField')}
                value={album.label.name}
                href={`/musica/sellos/${album.label.slug}`}
              />
            )}
            {album.catalog_number && (
              <AlbumMetaField label={t('album.catalogNumber')} value={album.catalog_number} mono />
            )}
            <AlbumMetaField label={t('album.tracks')} value={String(album.tracks.length)} />
            {album.condition && (
              <AlbumMetaField label={t('album.condition')} value={t(`conditions.${album.condition}`)} />
            )}
            {album.for_trade && <AlbumMetaField label={t('album.tradeField')} value={t('album.tradeAvailable')} />}
          </dl>

          {clubs.length > 0 && (
            <div className="pt-2">
              <AlbumGenreTags clubs={clubs} />
            </div>
          )}
        </div>
      </div>

      {/* Notes — full width, collapsible if long. Wikipedia-style descriptions
          would otherwise turn the metadata column into a thin tower. */}
      {album.notes && (
        <section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40 sm:p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {t('album.aboutAlbum')}
          </h2>
          <AlbumNotes notes={album.notes} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {t('album.tracklistHeading')}
        </h2>
        <AlbumTracklist album={album} audioUrlByTrackId={audioUrlByTrackId} />
      </section>

      <AlbumReactionsBar albumId={album.id} initial={reactions} signedIn={signedIn} />

      {media.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {t('album.galleryHeading')}
          </h2>
          <MusicMediaGrid items={media} />
        </section>
      )}

      <AlbumExtraImages
        backCoverCfImageId={album.back_cover_cf_image_id}
        labelCfImageId={album.label_cf_image_id}
      />
    </div>
  );
}
