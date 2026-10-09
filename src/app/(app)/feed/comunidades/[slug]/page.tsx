import { notFound } from 'next/navigation';
import {
  getCommunityBySlug,
  getCommunityPosts,
  getPendingJoinRequests,
  getViewerJoinState,
} from '@/features/communities/server/communities.server';
import { CommunityHomeMain } from '@/features/communities/components/CommunityHomeMain';
import { getCommunitySections, getCommunityProfileCapabilities } from '@/features/communities/server/community-plan.server';
import { getCommunityTheme } from '@/features/communities/server/community-theme.server';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CommunityHomePage({ params }: PageProps) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const [posts, viewerState, pendingRequests, sections, capabilities, theme] = await Promise.all([
    getCommunityPosts(community.id, { page: 1, limit: 10 }),
    getViewerJoinState(community.id),
    getPendingJoinRequests(community.id),
    getCommunitySections(community.id),
    getCommunityProfileCapabilities(community.id),
    getCommunityTheme(community.id),
  ]);

  return (
    <CommunityHomeMain
      community={community}
      posts={posts.posts}
      viewerState={viewerState}
      pendingRequests={pendingRequests}
      sections={sections}
      theme={theme}
      canManageTheme={capabilities.settings}
    />
  );
}
