import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getServerClient } from '@/utils/supabase/server';
import {
  getMusicClubBySlug,
  getViewerJoinStatus,
  getViewerRoleInClub,
  listClubPosts,
} from '@/features/music-archive/server/clubs.server';
import { MusicPostsFeed } from '@/features/music-archive/components/club/MusicPostsFeed';

export default async function ClubPostsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const club = await getMusicClubBySlug(slug);
  if (!club) notFound();
  const [posts, viewerRole, joinStatus, t] = await Promise.all([
    listClubPosts(club.id, 50),
    getViewerRoleInClub(club.id),
    getViewerJoinStatus(club.id),
    getTranslations('musica'),
  ]);
  const client = await getServerClient();
  const { data: u } = await client.auth.getUser();
  const canPost = !!viewerRole;
  const canModerate = viewerRole === 'OWNER' || viewerRole === 'ADMIN' || viewerRole === 'MODERATOR';

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {t('clubs.postsHeading')}
      </h2>
      <MusicPostsFeed
        clubId={club.id}
        clubSlug={slug}
        posts={posts}
        canPost={canPost}
        joinStatus={joinStatus}
        viewerId={u.user?.id ?? null}
        canModerate={canModerate}
      />
    </section>
  );
}
