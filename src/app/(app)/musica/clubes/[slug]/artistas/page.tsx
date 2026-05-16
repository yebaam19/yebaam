import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  getMusicClubBySlug,
  listClubArtists,
} from '@/features/music-archive/server/clubs.server';
import { ClubArtistsList } from '@/features/music-archive/components/club/ClubArtistsList';

export default async function ClubArtistsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getMusicClubBySlug(slug);
  if (!club) notFound();
  const [artists, t] = await Promise.all([
    listClubArtists(club.id),
    getTranslations('musica'),
  ]);
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {t('clubs.artistsHeading')}
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t('clubs.artistsSubtitle')}
      </p>
      <ClubArtistsList artists={artists} />
    </section>
  );
}
