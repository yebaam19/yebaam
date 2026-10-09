import type { ReactNode } from 'react';
import {
  getCommunityBySlug,
  getCommunityAccessPreview,
  getViewerJoinState,
} from '@/features/communities/server/communities.server';
import { getCommunityHeaderImages } from '@/features/communities/server/community-header-images.server';
import { getCommunityTheme } from '@/features/communities/server/community-theme.server';
import { getCommunityShowcase } from '@/features/communities/server/community-showcase.server';
import { CommunityProfileHeader } from '@/features/communities/components/showcase/CommunityProfileHeader';
import { CommunityLayoutShell } from '@/features/communities/components/CommunityLayoutShell';
import { CommunityAccessPreview } from '@/features/communities/components/CommunityAccessPreview';
import { CommunityUnavailable } from '@/features/communities/components/CommunityUnavailable';
import { CommunityInstitutionalNav } from '@/features/communities/components/CommunityInstitutionalNav';
import { getCommunitySections, getCommunityProfileCapabilities, usesStructuredRules } from '@/features/communities/server/community-plan.server';

interface CommunityLayoutProps {
  params: Promise<{ slug: string }>;
  children: ReactNode;
}

export default async function CommunityLayout({ params, children }: CommunityLayoutProps) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) {
    const preview = await getCommunityAccessPreview(slug);
    if (!preview) return <CommunityUnavailable />;
    const viewerState = await getViewerJoinState(preview.id);
    return <><meta name="robots" content="noindex" /><CommunityAccessPreview community={preview} viewerState={viewerState} /></>;
  }

  const [viewerState, sections, capabilities, migratedRules, showcase, headerImages, theme] = await Promise.all([
    getViewerJoinState(community.id), getCommunitySections(community.id),
    getCommunityProfileCapabilities(community.id), usesStructuredRules(community.id), getCommunityShowcase(community.id), getCommunityHeaderImages(community.id), getCommunityTheme(community.id),
  ]);

  return (
    <CommunityLayoutShell theme={theme} headerImages={headerImages} canManageHeader={capabilities.settings} community={community} viewerState={viewerState} profileHeader={
      <CommunityProfileHeader headerImages={headerImages} community={community} canManageHeader={capabilities.settings} canEdit={capabilities.content} showcase={showcase} />
    } institutionalNavigation={
      <CommunityInstitutionalNav slug={slug} sections={sections} canManage={capabilities.settings}
        legacyRules={!migratedRules && Boolean(community.rules?.length)} />
    }>
      {children}
    </CommunityLayoutShell>
  );
}
