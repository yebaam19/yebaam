import { notFound } from 'next/navigation';
import {
  getCommunityBySlug,
  getCommunityHomePosts,
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
  const postsPromise = getCommunityHomePosts(community.id, cursor, community.slug);
  // The posts boundary observes this promise after the faster profile reads finish.
  void postsPromise.catch(() => {});

  const [viewerState, sections, capabilities, theme, topTabs] = await Promise.all([
    getViewerJoinState(community.id),
    getCommunitySections(community.id),
    getCommunityProfileCapabilities(community.id),
    getCommunityTheme(community.id),
    getCommunityTopTabs(community.id),
  ]);

  return (
    <CommunityHomeMain
      community={community}
      postsPromise={postsPromise}
      postsCursor={cursor}
      viewerState={viewerState}
      sections={sections}
      topTabs={topTabs}
      theme={theme}
      canManageTheme={capabilities.settings}
    />
  );
}
