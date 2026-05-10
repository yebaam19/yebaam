import { notFound } from 'next/navigation';
import { getServerClient } from '@/utils/supabase/server';
import {
  getMusicClubBySlug,
  getViewerRoleInClub,
  listClubMembers,
} from '@/features/music-archive/server/clubs.server';
import { ClubMembersList } from '@/features/music-archive/components/club/ClubMembersList';
import type { ClubMemberRole } from '@/features/music-archive/types/music.types';

export default async function ClubMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getMusicClubBySlug(slug);
  if (!club) notFound();
  const [members, viewerRole] = await Promise.all([
    listClubMembers(club.id),
    getViewerRoleInClub(club.id),
  ]);
  const client = await getServerClient();
  const { data: u } = await client.auth.getUser();

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Miembros del club ({members.length})
      </h2>
      <ClubMembersList
        clubId={club.id}
        members={members}
        viewerRole={(viewerRole as ClubMemberRole | null) ?? null}
        viewerId={u.user?.id ?? null}
      />
    </section>
  );
}
