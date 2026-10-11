import { notFound } from 'next/navigation';
import {
  getCommunityBySlug,
  getCommunityHomePosts,
  getPendingJoinRequests,
  getViewerJoinState,
} from '@/features/communities/server/communities.server';
import { CommunityHomeMain } from '@/features/communities/components/CommunityHomeMain';
import { getCommunitySections, getCommunityProfileCapabilities } from '@/features/communities/server/community-plan.server';
import { getCommunityTheme } from '@/features/communities/server/community-theme.server';
import { getCommunityTopTabs } from '@/features/communities/server/community-top-tabs.server';
import { parseCommunityPostCursor } from '@/features/communities/schemas/communityPostCursor.schema';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ postsCursor?: string }>;
}

export default async function CommunityHomePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { postsCursor } = await searchParams;
  const cursor = parseCommunityPostCursor(postsCursor);
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const [posts, viewerState, pendingRequests, sections, capabilities, theme, topTabs] = await Promise.all([
    getCommunityHomePosts(community.id, cursor, community.slug),
    getViewerJoinState(community.id),
    getPendingJoinRequests(community.id),
    getCommunitySections(community.id),
    getCommunityProfileCapabilities(community.id),
    getCommunityTheme(community.id),
    getCommunityTopTabs(community.id),
  ]);

  return (
    <CommunityHomeMain
      community={community}
      posts={posts.posts}
      nextPostsCursor={posts.nextCursor}
      isFirstPostsPage={!cursor}
      viewerState={viewerState}
      pendingRequests={pendingRequests}
      sections={sections}
      topTabs={topTabs}
      theme={theme}
      canManageTheme={capabilities.settings}
    />
  );
}
