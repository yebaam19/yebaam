import { notFound } from 'next/navigation';
import {
  getCommunityBySlug,
  getCommunityPosts,
  getPendingJoinRequests,
  getViewerJoinState,
} from '@/features/communities/server/communities.server';
import { CommunityHomeMain } from '@/features/communities/components/CommunityHomeMain';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CommunityHomePage({ params }: PageProps) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const [posts, viewerState, pendingRequests] = await Promise.all([
    getCommunityPosts(community.id, { page: 1, limit: 10 }),
    getViewerJoinState(community.id),
    getPendingJoinRequests(community.id),
  ]);

  return (
    <CommunityHomeMain
      community={community}
      posts={posts.posts}
      viewerState={viewerState}
      pendingRequests={pendingRequests}
    />
  );
}
