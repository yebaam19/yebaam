import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  getMusicClubBySlug,
  getViewerRoleInClub,
  listClubLinks,
} from '@/features/music-archive/server/clubs.server';
import { ClubLinksList } from '@/features/music-archive/components/club/ClubLinksList';

export default async function ClubLinksPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getMusicClubBySlug(slug);
  if (!club) notFound();
  const [links, viewerRole, t] = await Promise.all([
    listClubLinks(club.id),
    getViewerRoleInClub(club.id),
    getTranslations('musica'),
  ]);
  const canEdit = viewerRole === 'OWNER' || viewerRole === 'ADMIN';
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {t('clubs.linksHeading')}
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t('clubs.linksSubtitle')}
      </p>
      <ClubLinksList clubId={club.id} links={links} canEdit={canEdit} />
    </section>
  );
}
