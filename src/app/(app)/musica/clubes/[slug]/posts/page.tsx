import { notFound } from 'next/navigation';
import { getServerClient } from '@/utils/supabase/server';
import {
  getMusicClubBySlug,
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
  const [posts, viewerRole] = await Promise.all([
    listClubPosts(club.id, 50),
    getViewerRoleInClub(club.id),
  ]);
  const client = await getServerClient();
  const { data: u } = await client.auth.getUser();
  const canPost = !!viewerRole;
  const canModerate = viewerRole === 'OWNER' || viewerRole === 'ADMIN' || viewerRole === 'MODERATOR';

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Publicaciones
      </h2>
      <MusicPostsFeed
        clubId={club.id}
        posts={posts}
        canPost={canPost}
        viewerId={u.user?.id ?? null}
        canModerate={canModerate}
      />
    </section>
  );
}
