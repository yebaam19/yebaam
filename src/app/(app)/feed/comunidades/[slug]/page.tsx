import { notFound } from 'next/navigation';
import {
  getCommunityBySlug,
  getCommunityMembers,
  getCommunityPosts,
  getPendingJoinRequests,
  getViewerJoinState,
} from '@/features/communities/server/communities.server';
import { CommunityDetailClient } from '@/features/communities/components/CommunityDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const [posts, members, viewerState, pendingRequests] = await Promise.all([
    getCommunityPosts(community.id, { page: 1, limit: 10 }),
    getCommunityMembers(community.id, { page: 1, limit: 20 }),
    getViewerJoinState(community.id),
    getPendingJoinRequests(community.id),
  ]);

  return (
    <CommunityDetailClient
      slug={slug}
      initialCommunity={community}
      initialPosts={posts}
      initialMembers={members}
      initialViewerState={viewerState}
      initialPendingRequests={pendingRequests}
    />
  );
}
