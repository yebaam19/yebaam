import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  getMusicClubBySlug,
  listAlbumsForClub,
} from '@/features/music-archive/server/clubs.server';
import { AlbumCoverCard } from '@/features/music-archive/components/AlbumCoverCard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations('musica');
  const club = await getMusicClubBySlug(slug);
  if (!club) return { title: t('clubs.clubNotFound') };
  return {
    title: t('clubs.detailMetaTitle', { name: club.name }),
    description: t('clubs.detailMetaDescription', {
      description: club.description,
      albumCount: club.album_count,
      memberCount: club.member_count,
    }),
  };
}

export default async function MusicClubDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getMusicClubBySlug(slug);
  if (!club) notFound();
  const [albums, t] = await Promise.all([
    listAlbumsForClub(club.id),
    getTranslations('musica'),
  ]);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {t('clubs.discosHeading')}
      </h2>
      {albums.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
          {t('clubs.emptyDiscos')}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {albums.map((album, index) => (
            <AlbumCoverCard
              key={album.id}
              album={album}
              artistName={album.artist_name}
              isLcp={index === 0}
            />
          ))}
        </div>
      )}
    </section>
  );
}
