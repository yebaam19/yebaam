import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getServerClient } from '@/utils/supabase/server';
import {
  getMusicClubBySlug,
  getViewerJoinStatus,
  getViewerRoleInClub,
  listClubMembers,
} from '@/features/music-archive/server/clubs.server';
import { ClubMembersList } from '@/features/music-archive/components/club/ClubMembersList';
import { ClubJoinCTA } from '@/features/music-archive/components/club/ClubJoinCTA';
import type { ClubMemberRole } from '@/features/music-archive/types/music.types';

export default async function ClubMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getMusicClubBySlug(slug);
  if (!club) notFound();
  const [members, viewerRole, joinStatus, t] = await Promise.all([
    listClubMembers(club.id),
    getViewerRoleInClub(club.id),
    getViewerJoinStatus(club.id),
    getTranslations('musica'),
  ]);
  const client = await getServerClient();
  const { data: u } = await client.auth.getUser();
  const isMember = joinStatus.kind === 'approved';

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {t('clubs.membersHeading', { count: members.length })}
      </h2>
      {!isMember && (
        <ClubJoinCTA
          clubId={club.id}
          clubSlug={slug}
          status={joinStatus}
          label={t('clubs.joinForMembersList')}
        />
      )}
      <ClubMembersList
        clubId={club.id}
        members={members}
        viewerRole={(viewerRole as ClubMemberRole | null) ?? null}
        viewerId={u.user?.id ?? null}
      />
    </section>
  );
}
